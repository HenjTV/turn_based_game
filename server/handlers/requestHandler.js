import path from "path";
import { getCharacterImages, serveFile } from "../utils/fileUtils.js";

// Go up two levels from server/handlers to the root of the project
const PUBLIC_DIR = path.resolve(__dirname, "../../public");
const CHARACTER_IMAGES_FOLDER = path.resolve(__dirname, "../../images/characters");

export function handleRequest(req, server) {
    const url = new URL(req.url);

    // Serve the client index.html
    if (url.pathname === "/client") {
        const indexPath = path.join(PUBLIC_DIR, "index.html");
        return serveFile(indexPath, "text/html");
    }

    // Serve static config files
    if (url.pathname.startsWith("/config/")) {
        const configFilePath = path.join(PUBLIC_DIR, url.pathname);
        return serveFile(configFilePath, "application/json");
    }

    // API to fetch character images
    if (url.pathname === "/api/characters") {
        const characters = getCharacterImages(CHARACTER_IMAGES_FOLDER);
        return new Response(JSON.stringify({ characters }), {
            headers: { "Content-Type": "application/json" },
        });
    }

    // Serve character images
    if (url.pathname.startsWith("/images/characters/")) {
        const fileName = url.pathname.replace("/images/characters/", "");
        const imagePath = path.join(CHARACTER_IMAGES_FOLDER, fileName);

        return serveFile(imagePath, "image/png");
    }

    // Handle WebSocket upgrades
    if (url.pathname === "/ws" && server.upgrade(req)) return;

    // Fallback to serve public files
    const publicFilePath = path.join(PUBLIC_DIR, url.pathname);
    return serveFile(publicFilePath);
}
