export async function getFeed(c: any) {
	const db = c.env.DB as D1Database;
	const { results } = await db.prepare("SELECT * FROM feed_messages ORDER BY created_at DESC LIMIT 100").all();

	return c.json({
		success: true,
		result: results,
	});
}
