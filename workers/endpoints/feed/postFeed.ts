export async function postFeed(c: any) {
	const db = c.env.DB as D1Database;
	const body = await c.req.json();
	const message = body.message;
	const author = body.author;

	const { results } = await db
		.prepare("INSERT INTO feed_messages (message, author) VALUES (?, ?) RETURNING *")
		.bind(message, author)
		.all();

	return c.json({
		success: true,
		result: results[0],
	});
}
