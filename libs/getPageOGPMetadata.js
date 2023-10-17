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

    const titleEl = root.querySelector('meta[property="og:title"]');
    const descEl = root.querySelector('meta[property="og:description"]');
    let imgEl = root.querySelector('meta[property="og:image"]');

    imgEl ??= root.querySelector('link[rel="apple-touch-icon"]');
    imgEl ??= root.querySelector('link[rel="icon"]')?.firstChild;

    let image = "";

    if(imgEl) {
        const attrs = imgEl.attributes;
        
        if(attrs.content) image = attrs.content;
        else if(attrs.href) image = attrs.href;
    }

    return {
        title: titleEl?.getAttribute("content") ?? "",
        description: descEl?.getAttribute("content") ?? "",
        image
    }
}