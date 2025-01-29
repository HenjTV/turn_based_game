import { serve } from "bun";
import { handleRequest } from "./handlers/requestHandler.js";
import { handleWebSocket } from "./handlers/websocketHandler.js";

const PORT = 8108;

const server = serve({
    port: PORT,
    fetch(req, server) {
        return handleRequest(req, server);
    },
    websocket: handleWebSocket(),
});

console.log(`Server running on http://localhost:${PORT}`);