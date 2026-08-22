export async function getTasks(c: any) {
    const db = c.env.DB as D1Database;
    const { results } = await db.prepare("SELECT * FROM tasks ORDER BY updated_at DESC LIMIT 100").all();
    return c.json({ success: true, result: results });
}
