import http from "node:http";
import path from "node:path";
import fs from "node:fs/promises";

import { getPageOGPMetadata } from "./libs/getPageOGPMetadata.js";

import { Deta } from "deta";

import mimeTypes from "./libs/mimeTypes.json" assert { type: "json" };
import fontList from "./libs/font-list.json" assert { type: "json" };

import { renderTemplate } from "./libs/utils.js";

const PORT = process.env.PORT || 3000;
const PUBLIC = path.resolve("public");
const VIEWS = path.resolve("views");

const deta = Deta();
const base = deta.Base("bookmarks");

function getMimeType(file) {
    const ext = path.extname(file).slice(1);

    return mimeTypes[ext];
}

/** @param {http.ServerResponse} res */
async function handleIndex(res, isLoggedIn) {
    const filePath = path.join(VIEWS, "index.html");

    await fs.access(filePath);

    const template = await fs.readFile(filePath, "utf8");

    let { items } = await base.fetch();

    if (items.length > 1) {
        items = items.sort((a, b) => new Date(+b.createdAt) - new Date(+a.createdAt));
    }

    const args = [
        items,
        fontList,
        isLoggedIn,
        process.env.APP_TITLE
    ];

    const html = renderTemplate(template, "bookmarks,fonts,isLoggedIn,appTitle", args);

    res.writeHead(200, { "Content-Type": "text/html" });
    res.write(html);
}

async function parseMetadata(res, url) {
    const metadata = await getPageOGPMetadata(url);
    res.writeHead(200, { "Content-Type": "application/json" });
    res.write(JSON.stringify(metadata));
}

/**
 * If the body argument contains the key value, it asks to update the bookmark, if not, it asks to insert it.
 * @param {String} rawBody
 * @param {http.ServerResponse} res 
 */
async function addBookmark(rawBody, res) {
    const body = JSON.parse(rawBody);

    if (!body.type || !body.title
        || (!body.colors && !body.url && !body.font)) throw Error("Wrong bookmark data.");

    if (body.key) {
        const key = body.key;
        delete body.key;

        await base.update(body, key);
    } else {
        body.createdAt = `${Date.now()}`;
        await base.put(body);
    }

    res.writeHead(201);
}

/**
 * 
 * @param {http.IncomingMessage} req 
 * @param {http.ServerResponse} res 
 * @param {String} key Deta base item key.
 */
async function deleteBookmark(req, res, key) {
    if (req.method !== "DELETE") {
        res.writeHead(404);
        return;
    }

    if (!key) throw Error("Key not found!");

    await base.delete(key);

    res.writeHead(200);
}

/**
 * 
 * @param {http.IncomingMessage} req 
 * @param {http.ServerResponse} res 
 */
async function handleStaticFiles(req, res) {
    const filePath = path.join(PUBLIC, req.url);

    try {
        await fs.access(filePath);
        const contents = await fs.readFile(filePath);

        res.writeHead(200, { "Content-Type": getMimeType(req.url) });
        res.write(contents);
    } catch (err) {
        console.error(filePath, "not found!");
        res.writeHead(404);
    }

    res.end();
}

/**
 * Handle incoming requests.
 * @param {http.IncomingMessage} req 
 * @param {http.ServerResponse} res 
 */
async function handleServer(req, res) {
    const { pathname, searchParams } = new URL(req.url, `http://${req.headers.host}`);

    switch (pathname) {
        case "/":
            const isLoggedIn = req.headers["referer"] === "https://deta.space/" ||
                process.env.DETA_SPACE_APP_HOSTNAME.startsWith("localhost");

            await handleIndex(res, isLoggedIn)
                .catch(err => res.writeHead(500, { "x-error": err.toString() }))
                .finally(() => res.end());
            break;
        case "/api/ogp":
            await parseMetadata(res, searchParams.get("url"))
                .catch(err => res.writeHead(500, { "x-error": err.toString() }))
                .finally(() => res.end())
            break;
        case "/api/delete":
            await deleteBookmark(req, res, searchParams.get("key"))
                .catch(err => res.writeHead(500, { "x-error": err.toString() }))
                .finally(() => res.end());
            break;
        case "/api/add":
            let body = [];

            if (req.method !== "POST" && req.headers["content-type"] !== "application/json") {
                res.end(400);
                return;
            }

            const onEnd = async () => {
                body = Buffer.concat(body).toString();

                await addBookmark(body, res)
                    .catch(err => res.writeHead(500, { "x-error": err.toString() }))
                    .finally(() => res.end());
            };

            req.on("data", (chunk) => body.push(chunk))
                .on("end", onEnd);
            break;
        default:
            await handleStaticFiles(req, res);
    }
}

const server = http.createServer(handleServer);
server.listen(PORT, () => console.log(`Server listening on ${PORT}`));