import { handleFindLobby, removePlayerFromLobby } from "./lobbyManager";
import { handleMakeMove, handleDisconnect } from "./gameHandler";
import { ServerWebSocket } from "bun";

export function handleWebSocket() {
    return {
        open(ws: ServerWebSocket) {
            console.log("New client connected");
        },
        message(ws: ServerWebSocket, message: string) {
            const data: any = JSON.parse(message);
            if (data.action === "findLobby") handleFindLobby(ws, data);
            if (data.action === "makeMove") handleMakeMove(ws, data);
            if (data.action === "disconnect") handleDisconnect(ws, data);
        },
        close(ws: ServerWebSocket) {
            console.log("Client disconnected");
            removePlayerFromLobby(ws);
        },
    };
}