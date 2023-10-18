import { parse } from "node-html-parser";

/**
 * 
 * @param {String} url 
 * @returns Object
 */
export async function getPageOGPMetadata(url) {
    const req = await fetch(url);

    if(!req.ok) return {};

    const htmlData = await req.text();

    const root = parse(htmlData);

    let titleEl = root.querySelector('meta[property="og:title"]');
    let descEl = root.querySelector('meta[property="og:description"]');
    let imgEl = root.querySelector('meta[property="og:image"]');

    descEl ??= root.querySelector('meta[name="description"]');

    imgEl ??= root.querySelector('link[rel="apple-touch-icon"]');
    imgEl ??= root.querySelector('link[rel="icon"]')?.firstChild;

    let image = "";
    let title = "";

    if(imgEl) {
        const attrs = imgEl.attributes;
        
        if(attrs.content) image = attrs.content;
        else if(attrs.href) image = attrs.href;
    }

    if(!titleEl) title = root.querySelector("title").innerText;
    else title = titleEl?.getAttribute("content") ?? "";

    return {
        description: descEl?.getAttribute("content") ?? "",
        title,
        image
    }
}