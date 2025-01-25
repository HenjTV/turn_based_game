import { serve } from "bun";
import fs from "fs";
import path from "path";
import { handleFindLobby, removePlayerFromLobby } from "./lobbyManager.js";
import { handleMakeMove } from "./gameHandler.js";

const PORT = 8108;
const CHARACTER_IMAGES_FOLDER = path.resolve("../images/characters");

const getCharacterImages = () => {
    try {
        // Read the directory and filter for PNG image files
        const files = fs.readdirSync(CHARACTER_IMAGES_FOLDER);
        return files.filter(file => /\.png$/i.test(file)); // Filter only PNG images
    } catch (error) {
        console.error("Error reading character images:", error);
        return [];
    }
};

const server = serve({
    port: PORT,
    fetch(req, server) {
        const url = new URL(req.url);

        // Static file handling
        if (url.pathname === "/client") return new Response(Bun.file("../public/index.html"));
        if (url.pathname === "/client.js") return new Response(Bun.file("../public/client.js"));
        if (url.pathname === "/style.css") return new Response(Bun.file("../public/style.css"));

        // Serve the character images list
        if (url.pathname === "/api/characters") {
            const characters = getCharacterImages(); // Get the list of image files
            return new Response(JSON.stringify({ characters }), {
                headers: { "Content-Type": "application/json" },
            });
        }

        // Serve the character images list
        if (url.pathname.startsWith("/images/characters/")) {
            const fileName = url.pathname.replace("/images/characters/", "");
            const filePath = path.resolve(CHARACTER_IMAGES_FOLDER, fileName);

            try {
                return new Response(Bun.file(filePath), {
                    headers: { "Content-Type": "image/png" }, // All images are PNG
                });
            } catch (error) {
                console.error("File not found:", filePath);
                return new Response("File not found", { status: 404 });
            }
        }

        // WebSocket upgrade
        if (url.pathname === "/ws" && server.upgrade(req)) return;

        return new Response("Not found", { status: 404 });
    },
    websocket: {
        open(ws) {
            console.log("New client connected");
        },
        message(ws, message) {
            const data = JSON.parse(message);
            if (data.action === "findLobby") handleFindLobby(ws, data);
            if (data.action === "makeMove") handleMakeMove(ws, data);
        },
        close(ws) {
            console.log("Client disconnected");
            removePlayerFromLobby(ws);
        },
    },
});

console.log(`Server running on http://localhost:${PORT}`);
