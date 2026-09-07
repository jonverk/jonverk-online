import { Hono } from "hono";
import { createRequestHandler } from "react-router";
import { routePartykitRequest } from "partyserver";

import { feedRouter } from "./endpoints/feed/router";
import { searchRouter } from "./endpoints/search/router";
import { scheduled as cronWikiScheduled } from "./cron-wiki";

export { Chat } from "./chat";

const app = new Hono<{ Bindings: Env }>();

app.get("/api/health", (c) => c.json({ ok: true }));

app.route("/api/feed", feedRouter);
app.route("/api/search", searchRouter);

app.all("*", (c) => {
	const requestHandler = createRequestHandler(
		() => import("virtual:react-router/server-build"),
		import.meta.env.MODE,
	);

	return requestHandler(c.req.raw, {
		cloudflare: { env: c.env, ctx: c.executionCtx },
	});
});

export default {
	async fetch(request, env, ctx) {
		const partyResponse = await routePartykitRequest(request, { ...env });
		return partyResponse ?? app.fetch(request, env, ctx);
	},
	// SkyGape-D2: overnight AI digest — fired by the crontrigger in wrangler.jsonc.
	scheduled: cronWikiScheduled,
} satisfies ExportedHandler<Env>;
