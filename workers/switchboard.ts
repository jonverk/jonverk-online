import { type Connection, Server, type WSMessage } from "partyserver";

export class Switchboard extends Server<Env> {
    static options = { hibernate: true };

    onConnect(connection: Connection) {
        connection.send(
            JSON.stringify({ type: "connected", message: "Connected to Switchboard" })
        );
    }

    onMessage(connection: Connection, message: WSMessage) {
        try {
            const parsed = JSON.parse(message as string);

            // Broadcast Kanban state updates or synthetic events to all clients
            if (parsed.type === "broadcast_kanban_state" || parsed.type === "agent_action") {
                this.broadcast(JSON.stringify(parsed));
            }
        } catch (e) {
            console.error("Failed to parse message", e);
        }
    }
}
