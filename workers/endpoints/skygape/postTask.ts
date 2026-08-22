import { nanoid } from "nanoid";

export async function postTask(c: any) {
    const db = c.env.DB as D1Database;
    const body = await c.req.json();
    const id = body.id || nanoid();
    const board_id = body.board_id;
    const title = body.title;
    const status = body.status;

    const { results } = await db
        .prepare(`
            INSERT INTO tasks (id, board_id, title, status)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(id)
            DO UPDATE SET title=excluded.title, status=excluded.status, updated_at=CURRENT_TIMESTAMP
            RETURNING *
        `)
        .bind(id, board_id, title, status)
        .all();

    return c.json({ success: true, result: results[0] });
}
