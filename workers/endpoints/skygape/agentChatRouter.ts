import { Hono } from "hono";
import { nanoid } from "nanoid";

export const agentChatRouter = new Hono<{ Bindings: Env }>();

agentChatRouter.post("/message", async (c) => {
    const db = c.env.DB as D1Database;
    const body = await c.req.json();
    const id = nanoid();
    const agent_id = body.agent_id;
    const channel = body.channel || "general";
    const content = body.content;

    // We can store agent chat in a dedicated table or reuse a general one. Let's create an agent_messages table implicitly or use audit stream.
    // Assuming agent communication can be logged to audit_stream for simplicity of the vault,
    // or broadcast via Switchboard. We will broadcast to the switchboard DO.

    const switchboardId = c.env.Switchboard.idFromName("global-switchboard");
    const switchboardStub = c.env.Switchboard.get(switchboardId);

    // Instead of direct WS, we can send a POST to the DO if it supports fetch,
    // but Partyserver handles connections directly.

    // Fallback: Just log it to audit_stream to act as the persistent log of the chat.
    await db.prepare(`
        INSERT INTO audit_stream (id, entity_type, entity_id, event_type, payload)
        VALUES (?, 'agent_chat', ?, 'message', ?)
    `).bind(id, channel, agent_id, content).run();

    return c.json({ success: true, id, message: "Agent message logged" });
});

agentChatRouter.get("/history/:channel", async (c) => {
    const db = c.env.DB as D1Database;
    const channel = c.req.param("channel");

    const { results } = await db.prepare(`
        SELECT * FROM audit_stream
        WHERE entity_type = 'agent_chat' AND entity_id = ?
        ORDER BY created_at ASC LIMIT 100
    `).bind(channel).all();

    return c.json({ success: true, result: results });
});
