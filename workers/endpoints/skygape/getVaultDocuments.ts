export async function getVaultDocuments(c: any) {
    const db = c.env.DB as D1Database;
    const { results } = await db.prepare("SELECT * FROM vault_documents ORDER BY updated_at DESC LIMIT 100").all();
    return c.json({ success: true, result: results });
}
