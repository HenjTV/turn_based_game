import path from "path";
import { getCharacterImages } from "../utils/fileUtils.js";

const PUBLIC_DIR = path.resolve("../public");
const CHARACTER_IMAGES_FOLDER = path.resolve("../images/characters");

export function handleRequest(req, server) {
    const url = new URL(req.url);

    if (url.pathname === "/client") {
        const indexFile = Bun.file(path.join(PUBLIC_DIR, "index.html"));
        return new Response(indexFile);
    }

    const filePath = path.join(PUBLIC_DIR, url.pathname);
    const publicFile = Bun.file(filePath);
    if (publicFile.size > 0) {
        return new Response(publicFile);
    }

    if (url.pathname === "/api/characters") {
        const characters = getCharacterImages(CHARACTER_IMAGES_FOLDER);
        return new Response(JSON.stringify({ characters }), {
            headers: { "Content-Type": "application/json" },
        });
    }

    if (url.pathname.startsWith("/images/characters/")) {
        const fileName = url.pathname.replace("/images/characters/", "");
        const imagePath = path.resolve(CHARACTER_IMAGES_FOLDER, fileName);

        try {
            return new Response(Bun.file(imagePath), {
                headers: { "Content-Type": "image/png" },
            });
        } catch (error) {
            return new Response("Image not found", { status: 404 });
        }
    }

    if (url.pathname === "/ws" && server.upgrade(req)) return;

    return new Response("Not found", { status: 404 });
}
