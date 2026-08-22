import { nanoid } from "nanoid";

export async function postBoard(c: any) {
    const db = c.env.DB as D1Database;
    const body = await c.req.json();
    const id = body.id || nanoid();
    const name = body.name;

    const { results } = await db
        .prepare(`
            INSERT INTO boards (id, name)
            VALUES (?, ?)
            ON CONFLICT(id)
            DO UPDATE SET name=excluded.name
            RETURNING *
        `)
        .bind(id, name)
        .all();

    return c.json({ success: true, result: results[0] });
}
