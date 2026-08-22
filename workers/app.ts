import { Hono } from "hono";
import { createRequestHandler } from "react-router";
import { routePartykitRequest } from "partyserver";

import { feedRouter } from "./endpoints/feed/router";
import { skygapeRouter } from "./endpoints/skygape/router";
import { synthesizeWiki } from "./wikiSynthesis";

export { Chat } from "./chat";
export { Switchboard } from "./switchboard";

const app = new Hono<{ Bindings: Env }>();

app.get("/api/health", (c) => c.json({ ok: true }));

app.route("/api/feed", feedRouter);
app.route("/api/skygape", skygapeRouter);

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
    async queue(batch: MessageBatch<any>, env: Env): Promise<void> {
        for (let message of batch.messages) {
            try {
                await synthesizeWiki(message.body, env);
                message.ack();
            } catch (error) {
                console.error("Queue synthesis failed", error);
                message.retry();
            }
        }
    }
} satisfies ExportedHandler<Env>;
