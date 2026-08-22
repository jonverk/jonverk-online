import { ApiException, fromHono } from "chanfana";
import { Hono } from "hono";
import { createRequestHandler } from "react-router";
import { routePartykitRequest } from "partyserver";

import { tasksRouter } from "./endpoints/tasks/router";
import { wikiRouter } from "./endpoints/wiki/router";

export { Chat } from "./chat";

const app = new Hono<{ Bindings: Env }>();

app.onError((err, c) => {
	if (err instanceof ApiException) {
		return c.json(
			{ success: false, errors: err.buildResponse() },
			err.status as any,
		);
	}
	console.error("Global error handler caught:", err);
	return c.json(
		{
			success: false,
			errors: [{ code: 7000, message: "Internal Server Error" }],
		},
		500,
	);
});

// Setup OpenAPI registry
const openapi = fromHono(app, {
	docs_url: "/api/docs",
	schema: {
		info: {
			title: "Cloud Headquarters API",
			version: "1.0.0",
			description: "API for accessing tasks and wiki data.",
		},
	},
});

openapi.get("/api/health", (c) => c.json({ ok: true }));

openapi.route("/api/tasks", tasksRouter);
openapi.route("/api/wiki", wikiRouter);

// Fallback to React Router
app.all("*", (c) => {
	const requestHandler = createRequestHandler(
		() => import("virtual:react-router/server-build") as any,
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
