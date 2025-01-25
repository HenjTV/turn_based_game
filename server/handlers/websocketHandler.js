import { handleFindLobby, removePlayerFromLobby } from "./lobbyManager.js";
import { handleMakeMove, handleDisconnect } from "./gameHandler.js";

export function handleWebSocket() {
    return {
        open(ws) {
            console.log("New client connected");
        },
        message(ws, message) {
            const data = JSON.parse(message);
            if (data.action === "findLobby") handleFindLobby(ws, data);
            if (data.action === "makeMove") handleMakeMove(ws, data);
            if (data.action === "disconnect") handleDisconnect(ws, data);
        },
        close(ws) {
            console.log("Client disconnected");
            removePlayerFromLobby(ws);
        },
    };
}