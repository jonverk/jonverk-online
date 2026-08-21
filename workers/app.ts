import { Hono } from "hono";
import { createRequestHandler } from "react-router";
import { routePartykitRequest } from "partyserver";

export { Chat } from "./chat";

const app = new Hono();

app.get("/api/health", (c) => c.json({ ok: true }));

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
} satisfies ExportedHandler<Env>;
