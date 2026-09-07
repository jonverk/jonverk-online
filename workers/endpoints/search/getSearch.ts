import type { Context } from "hono";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/**
 * Render a user query string as a safe FTS5 MATCH expression.
 *
 * Each whitespace-separated token is double-quoted so FTS5 operators and
 * special characters in the input are treated literally, tokens are AND-ed
 * together, and the last token is prefix-matched (`"foo"*`) so partial /
 * search-as-you-type queries still hit ("enginee" -> "engineer").
 */
function toFtsQuery(q: string): string {
	const tokens = q.trim().split(/\s+/).filter(Boolean);
	return tokens
		.map((token, i) => {
			const escaped = token.replaceAll('"', '""');
			const prefix = i === tokens.length - 1 ? "*" : "";
			return `"${escaped}"${prefix}`;
		})
		.join(" AND ");
}

export async function getSearch(c: Context<{ Bindings: Env }>) {
	const db = c.env.DB as D1Database;

	const q = (c.req.query("q") ?? "").trim();
	if (!q) {
		return c.json({ success: false, error: "Missing required query parameter: q" }, 400);
	}

	const rawLimit = Number(c.req.query("limit"));
	const limit =
		Number.isFinite(rawLimit) && rawLimit > 0
			? Math.min(Math.floor(rawLimit), MAX_LIMIT)
			: DEFAULT_LIMIT;

	const match = toFtsQuery(q);

	const { results } = await db
		.prepare(
			`SELECT p.id, p.title, p.type, p.created_at, p.updated_at,
					snippet(wiki_fts, 1, '<mark>', '</mark>', '…', 24) AS snippet,
					round(bm25(wiki_fts), 6) AS rank
			 FROM wiki_fts
			 JOIN wiki_pages p ON p.rowid = wiki_fts.rowid
			 WHERE wiki_fts MATCH ?
			 ORDER BY rank
			 LIMIT ?`,
		)
		.bind(match, limit)
		.all();

	return c.json({
		success: true,
		query: q,
		result: results,
	});
}