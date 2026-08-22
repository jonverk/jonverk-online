export async function postVaultDocument(c: any) {
    const db = c.env.DB as D1Database;
    const body = await c.req.json();
    const virtual_path = body.virtual_path;
    const content = body.content;

    const { results } = await db
        .prepare(`
            INSERT INTO vault_documents (virtual_path, content)
            VALUES (?, ?)
            ON CONFLICT(virtual_path)
            DO UPDATE SET content=excluded.content, updated_at=CURRENT_TIMESTAMP
            RETURNING *
        `)
        .bind(virtual_path, content)
        .all();

    return c.json({ success: true, result: results[0] });
}
