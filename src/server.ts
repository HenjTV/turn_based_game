import { serve, Server } from "bun";
import { handleRequest } from "./server/handlers/requestHandler";
import { handleWebSocket } from "./server/handlers/websocketHandler";

const PORT: number = 8108;

const server: Server = serve({
    port: PORT,
    fetch(req, server) {
        return handleRequest(req, server);
    },
    websocket: handleWebSocket(),
});

console.log(`Server running on http://localhost:${PORT}`);