import { type Connection, Server, type WSMessage } from "partyserver";

import type { ChatMessage, Message } from "../app/chat/shared";

export class Chat extends Server<Env> {
	static options = { hibernate: true };

	messages = [] as ChatMessage[];

	private broadcastMessage(message: Message, exclude?: string[]) {
		this.broadcast(JSON.stringify(message), exclude);
	}

	onStart() {
		this.ctx.storage.sql.exec(
			`CREATE TABLE IF NOT EXISTS messages (id TEXT PRIMARY KEY, user TEXT, role TEXT, content TEXT)`,
		);

		this.messages = this.ctx.storage.sql
			.exec(`SELECT * FROM messages`)
			.toArray() as ChatMessage[];
	}

	onConnect(connection: Connection) {
		connection.send(
			JSON.stringify({ type: "all", messages: this.messages } satisfies Message),
		);
	}

	private saveMessage(message: ChatMessage) {
		const existingMessage = this.messages.find((item) => item.id === message.id);
		if (existingMessage) {
			this.messages = this.messages.map((item) =>
				item.id === message.id ? message : item,
			);
		} else {
			this.messages.push(message);
		}

		this.ctx.storage.sql.exec(
			`INSERT INTO messages (id, user, role, content) VALUES (?, ?, ?, ?)
			 ON CONFLICT (id) DO UPDATE SET content = ?`,
			message.id,
			message.user,
			message.role,
			message.content,
			message.content,
		);
	}

	onMessage(_connection: Connection, message: WSMessage) {
		const parsed = JSON.parse(message as string) as Message;
		if (parsed.type !== "add" && parsed.type !== "update") return;

		const user = parsed.user.trim().slice(0, 32);
		const content = parsed.content.trim().slice(0, 2000);
		if (!parsed.id || !user || !content) return;

		const sanitized = {
			type: parsed.type,
			id: parsed.id.slice(0, 32),
			user,
			content,
			role: "user" as const,
		} satisfies Message;

		this.saveMessage(sanitized);
		this.broadcastMessage(sanitized);
	}
}
