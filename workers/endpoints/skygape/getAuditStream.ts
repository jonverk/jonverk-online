export async function getAuditStream(c: any) {
    const db = c.env.DB as D1Database;
    const { results } = await db.prepare("SELECT * FROM audit_stream ORDER BY created_at DESC LIMIT 100").all();
    return c.json({ success: true, result: results });
}
