// Remove this import
// import { serve, Server } from "bun";

import { handleRequest } from "./handlers/requestHandler";
import { handleWebSocket } from "./handlers/websocketHandler";

const PORT: number = 8108;

// Use Bun.serve directly (it's available globally)
const server = Bun.serve({
    port: PORT,
    fetch(req, server) {
        return handleRequest(req, server);
    },
    websocket: handleWebSocket(),
});

console.log(`Server running on http://localhost:${PORT}`);