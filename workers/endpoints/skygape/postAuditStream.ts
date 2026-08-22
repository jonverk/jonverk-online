import { nanoid } from "nanoid";

export async function postAuditStream(c: any) {
    const db = c.env.DB as D1Database;
    const body = await c.req.json();
    const id = body.id || nanoid();
    const entity_type = body.entity_type;
    const entity_id = body.entity_id;
    const event_type = body.event_type;
    const payload = body.payload;

    const { results } = await db
        .prepare(`
            INSERT INTO audit_stream (id, entity_type, entity_id, event_type, payload)
            VALUES (?, ?, ?, ?, ?)
            RETURNING *
        `)
        .bind(id, entity_type, entity_id, event_type, payload)
        .all();

    return c.json({ success: true, result: results[0] });
}
