import { serve } from "bun";
import { handleFindLobby, removePlayerFromLobby } from "./lobbyManager.js";
import { handleMakeMove } from "./gameHandler.js";

const PORT = 8108;

const server = serve({
    port: PORT,
    fetch(req, server) {
        const url = new URL(req.url);

        // Static file handling
        if (url.pathname === "/client") return new Response(Bun.file("../public/index.html"));
        if (url.pathname === "/client.js") return new Response(Bun.file("../public/client.js"));
        if (url.pathname === "/style.css") return new Response(Bun.file("../public/style.css"));

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