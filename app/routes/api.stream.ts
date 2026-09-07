import type { LoaderFunction } from "react-router";

/**
 * SkyGape C1 — Real-Time Agent Status & Event Stream (SSE)
 *
 * Server-Sent Events telemetry resource route, mounted at `/api/stream`
 * (registered in app/routes.ts before the `:roomId` catch-all).
 *
 * Wire protocol (each event is an SSE frame):
 *   event: hello     -> { clientId, clock, serverTime, stream, knownAgents }
 *   event: status    -> roster + liveness snapshot; emitted on connect and
 *                       every STATUS_INTERVAL_MS while the client is attached
 *   event: event     -> { type, ...payload, ts } live telemetry pushed from
 *                       other server code via emitStreamEvent()
 *   event: heartbeat -> { clientId, clock } keep-alive every HEARTBEAT_MS
 *   : keep-alive     -> bare SSE comment line so intermediaries don't buffer
 *                       the stream between heartbeat events
 *
 * Clients auto-reconnect 3s after a dropped connection (retry: hint).
 * Optional ?types=status,event,heartbeat selects which event types the client
 * receives; the connection hello always arrives first (default: all types).
 */

export type TelemetryEventPayload = Record<string, unknown>;

const encoder = new TextEncoder();

const HEARTBEAT_MS = 15_000;
const STATUS_INTERVAL_MS = 30_000;
const RETRY_MS = 3_000;
const STREAM_ID = "jonverk/skygape/agent/status";
const STREAM_BUS_SIGNAL = "bus-event";

/** Known employees of the JonVerk org — see /home/hermes/ORG.md. */
export const KNOWN_AGENTS = [
	{ tag: "ZHI", kind: "lead", name: "Zhi", role: "Project Lead · skygaper" },
	{ tag: "KAI", kind: "agent", name: "Karin", role: "coder · team karin" },
	{ tag: "EV", kind: "agent", name: "Evinne", role: "coder · jonverk" },
	{ tag: "JEN", kind: "agent", name: "Jenny", role: "creative coder" },
	{ tag: "STD", kind: "agent", name: "Stede", role: "veteran coder" },
	{ tag: "RUN", kind: "agent", name: "Runt", role: "junior coder" },
	{ tag: "KST", kind: "agent", name: "Kestrel", role: "coder" },
] as const;

/**
 * In-worker event bus so other server code can push telemetry into every open
 * `/api/stream` connection: `emitStreamEvent("agent.online", { tag: "EV" })`.
 * Module-private — this file stays the single owner of the live stream.
 */
const streamBus = new EventTarget();

/** Emit a telemetry event to every connected `/api/stream` client. */
export function emitStreamEvent(type: string, payload: TelemetryEventPayload = {}): void {
	streamBus.dispatchEvent(
		new CustomEvent(STREAM_BUS_SIGNAL, { detail: { type, payload, ts: Date.now() } }),
	);
}

function sseFrame(event: string, data: unknown, id: string | number): Uint8Array {
	return encoder.encode(`id: ${id}\nevent: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

function keepAliveLine(): Uint8Array {
	return encoder.encode(`: keep-alive ${Date.now()}\n\n`);
}

function helloData(clientId: string) {
	return {
		clientId,
		clock: Date.now(),
		serverTime: new Date().toISOString(),
		stream: STREAM_ID,
		knownAgents: KNOWN_AGENTS.map(({ tag, kind, name, role }) => ({ tag, kind, name, role })),
	};
}

function statusData() {
	return {
		clock: Date.now(),
		serverTime: new Date().toISOString(),
		stream: STREAM_ID,
		agents: KNOWN_AGENTS.map(({ tag, kind, name, role }) => ({ tag, kind, name, role })),
		active: true,
	};
}

export const loader: LoaderFunction = ({ request }) => {
	const allowedTypes = new Set(
		(new URL(request.url).searchParams.get("types") ?? "")
			.split(",")
			.map((name) => name.trim())
			.filter(Boolean),
	);
	const wantsType = (type: string) => allowedTypes.size === 0 || allowedTypes.has(type);

	const clientId = crypto.randomUUID().slice(0, 8);
	let seq = 0;

	const stream = new ReadableStream<Uint8Array>({
		start(controller) {
			let channels: ReturnType<typeof setInterval>[] = [];
			let unsubscribe: (() => void) | undefined;

			const send = (event: string, data: unknown) => {
				try {
					controller.enqueue(sseFrame(event, data, ++seq));
				} catch {
					cleanup();
				}
			};

			const cleanup = () => {
				for (const handle of channels) clearInterval(handle);
				channels = [];
				unsubscribe?.();
				unsubscribe = undefined;
			};

			const onBusEvent = (event: Event) => {
				const { type, payload, ts } = (
					event as CustomEvent<{ type: string; payload: TelemetryEventPayload; ts: number }>
				).detail;
				if (!wantsType(type)) return;
				send("event", { type, ts, ...payload });
			};

			try {
				controller.enqueue(encoder.encode(`retry: ${RETRY_MS}\n\n`));
			} catch {
				return cleanup();
			}
			send("hello", helloData(clientId));
			if (wantsType("status")) send("status", statusData());

			channels.push(
				setInterval(() => {
					if (!wantsType("heartbeat")) return;
					send("heartbeat", { clientId, clock: Date.now() });
					try {
						controller.enqueue(keepAliveLine());
					} catch {
						cleanup();
					}
				}, HEARTBEAT_MS),
				setInterval(() => {
					if (wantsType("status")) send("status", statusData());
				}, STATUS_INTERVAL_MS),
			);

			streamBus.addEventListener(STREAM_BUS_SIGNAL, onBusEvent);
			unsubscribe = () => streamBus.removeEventListener(STREAM_BUS_SIGNAL, onBusEvent);

			// Tear down when the client disconnects (workerd aborts the request).
			request.signal.addEventListener("abort", cleanup, { once: true });
		},
		cancel() {
			/* timers are cleared through the abort signal or a failed enqueue */
		},
	});

	return new Response(stream, {
		headers: {
			"Content-Type": "text/event-stream; charset=utf-8",
			"Cache-Control": "no-cache, no-transform",
			Connection: "keep-alive",
			"X-Accel-Buffering": "no",
		},
	});
};