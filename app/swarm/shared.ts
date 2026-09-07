/**
 * SkyGape — Swarm telemetry contract (client side).
 * Owned by SkyGape-C2 (jenny). Single source of truth for the swarm topology
 * view: worker node shapes, token pool shapes, and the wire events consumed
 * from the C1 telemetry stream (app/routes/api.stream.ts, SSE at /api/stream).
 *
 * Coordination notes for sibling cards (decided by C2, do not fork):
 *  - C1 (evinne) owns the SSE/WebSocket stream route. The stream MUST emit
 *    `snapshot` events (full SwarmSnapshot) and MAY emit incremental
 *    `node_status` / `pool_update` / `node_joined` / `node_left` events.
 *  - SwarmCanvas degrades to a clearly-labelled demo feed when the stream is
 *    not mounted yet, so this file is safe to land before C1 finishes.
 */

export type WorkerStatus = "idle" | "busy" | "blocked" | "offline";

export type WorkerRole =
	| "researcher"
	| "reviewer"
	| "writer"
	| "planner"
	| "operator"
	| "specialist";

/** A single active worker node in the swarm. */
export interface WorkerNode {
	id: string;
	name: string;
	role: WorkerRole;
	status: WorkerStatus;
	model: string;
	/** Current task label, when the node is working. */
	task?: string;
	/** Tokens consumed by this node since it joined. */
	tokensUsed: number;
	/** unix ms of the last status/telemetry update. */
	lastSeen: number;
	/** unix ms since the node joined the swarm. */
	joinedAt: number;
}

/** A shared token budget pool (per provider / per team). */
export interface TokenPool {
	id: string;
	name: string;
	/** Total budget for the pool. */
	total: number;
	/** Tokens already consumed. */
	used: number;
	/** Tokens reserved by in-flight tasks. */
	reserved: number;
	/** Approximate burn rate, tokens per minute. */
	ratePerMin: number;
	/** unix ms of the last update. */
	updatedAt: number;
}

/** Full point-in-time view of the swarm. */
export interface SwarmSnapshot {
	nodes: WorkerNode[];
	pools: TokenPool[];
	/** unix ms when the snapshot was produced. */
	updatedAt: number;
	/** Where the data came from — "live" when the C1 stream is connected. */
	source: "live" | "demo";
}

/** Incremental events the C1 stream may emit after the initial snapshot. */
export type SwarmEvent =
	| { type: "snapshot"; snapshot: SwarmSnapshot }
	| { type: "node_status"; nodeId: string; status: WorkerStatus; task?: string; at: number }
	| { type: "pool_update"; pool: TokenPool; at: number }
	| { type: "node_joined"; node: WorkerNode; at: number }
	| { type: "node_left"; nodeId: string; at: number };

/** Stream connection state surfaced to the UI. */
export type StreamState = "connecting" | "live" | "offline" | "demo";

export const WORKER_STATUS_ORDER: readonly WorkerStatus[] = ["idle", "busy", "blocked", "offline"];

export const WORKER_STATUS_LABEL: Record<WorkerStatus, string> = {
	idle: "Idle",
	busy: "Busy",
	blocked: "Blocked",
	offline: "Offline",
};

/** Tailwind-safe status colors (kept as literal class fragments). */
export const WORKER_STATUS_TONE: Record<WorkerStatus, string> = {
	idle: "#48b97c",
	busy: "#6d78a8",
	blocked: "#efbd54",
	offline: "#b9b9b4",
};

export function formatTokens(value: number): string {
	if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
	if (value >= 1_000) return `${(value / 1_000).toFixed(0)}k`;
	return String(Math.round(value));
}

export function formatRelative(ts: number, now: number): string {
	const seconds = Math.max(0, Math.round((now - ts) / 1000));
	if (seconds < 5) return "just now";
	if (seconds < 60) return `${seconds}s ago`;
	const minutes = Math.round(seconds / 60);
	if (minutes < 60) return `${minutes}m ago`;
	return `${Math.round(minutes / 60)}h ago`;
}

/* ------------------------------------------------------------------ */
/* Demo feed — used only while the C1 stream is not mounted.          */
/* ------------------------------------------------------------------ */

const DEMO_NODES: WorkerNode[] = [
	{ id: "evinne", name: "evinne", role: "researcher", status: "busy", model: "deepseek-v4-flash", task: "SkyGape-C1 stream contract", tokensUsed: 184_200, lastSeen: Date.now(), joinedAt: Date.now() - 3_600_000 },
	{ id: "kestrel", name: "kestrel", role: "specialist", status: "idle", model: "deepseek-v4-flash", task: undefined, tokensUsed: 96_400, lastSeen: Date.now(), joinedAt: Date.now() - 7_200_000 },
	{ id: "runt", name: "runt", role: "writer", status: "busy", model: "deepseek-v4-flash", task: "SkyGape-B1 wiki consumer", tokensUsed: 141_800, lastSeen: Date.now(), joinedAt: Date.now() - 5_400_000 },
	{ id: "karin", name: "karin", role: "reviewer", status: "blocked", model: "deepseek-v4-flash", task: "awaiting B2 review input", tokensUsed: 62_100, lastSeen: Date.now(), joinedAt: Date.now() - 9_000_000 },
	{ id: "jenny", name: "jenny", role: "operator", status: "busy", model: "deepseek-v4-flash", task: "SkyGape-C2 swarm canvas", tokensUsed: 210_500, lastSeen: Date.now(), joinedAt: Date.now() - 1_800_000 },
	{ id: "stede", name: "stede", role: "planner", status: "idle", model: "deepseek-v4-flash", task: undefined, tokensUsed: 33_700, lastSeen: Date.now(), joinedAt: Date.now() - 10_800_000 },
];

const DEMO_POOLS: TokenPool[] = [
	{ id: "openrouter", name: "openrouter", total: 2_000_000, used: 1_240_000, reserved: 210_000, ratePerMin: 4_800, updatedAt: Date.now() },
	{ id: "shared", name: "shared", total: 1_000_000, used: 512_000, reserved: 96_000, ratePerMin: 2_100, updatedAt: Date.now() },
	{ id: "reserve", name: "reserve", total: 500_000, used: 88_000, reserved: 40_000, ratePerMin: 600, updatedAt: Date.now() },
];

export function createDemoSnapshot(): SwarmSnapshot {
	const now = Date.now();
	return {
		nodes: DEMO_NODES.map((node) => ({ ...node, lastSeen: now, joinedAt: node.joinedAt })),
		pools: DEMO_POOLS.map((pool) => ({ ...pool, updatedAt: now })),
		updatedAt: now,
		source: "demo",
	};
}

/** Produce a plausible next demo event to keep the canvas alive offline. */
export function nextDemoEvent(snapshot: SwarmSnapshot): SwarmEvent {
	const now = Date.now();
	const roll = Math.random();
	if (roll < 0.45 && snapshot.nodes.length > 0) {
		const node = snapshot.nodes[Math.floor(Math.random() * snapshot.nodes.length)];
		const status: WorkerStatus =
			node.status === "busy" ? "idle" : node.status === "idle" ? "busy" : node.status;
		return {
			type: "node_status",
			nodeId: node.id,
			status,
			task: status === "busy" ? `task-${Math.floor(Math.random() * 90) + 10}` : undefined,
			at: now,
		};
	}
	if (roll < 0.8 && snapshot.pools.length > 0) {
		const pool = snapshot.pools[Math.floor(Math.random() * snapshot.pools.length)];
		const used = Math.min(pool.total, pool.used + Math.floor(Math.random() * 6_000));
		return {
			type: "pool_update",
			pool: { ...pool, used, reserved: Math.max(0, pool.reserved + Math.floor(Math.random() * 2_000) - 1_000), updatedAt: now },
			at: now,
		};
	}
	return { type: "snapshot", snapshot: { ...snapshot, updatedAt: now } };
}

/* ------------------------------------------------------------------ */
/* C1 wire-protocol adapter                                           */
/* Consumes the SSE stream defined in app/routes/api.stream.ts        */
/* (owned by SkyGape-C1 / evinne — do not fork; adapt to it here).    */
/* ------------------------------------------------------------------ */

/** Roster entry as emitted by C1 hello/status frames. */
export interface C1Agent {
	tag: string;
	kind: string;
	name: string;
	role: string;
}

const C1_EVENT_STATUS: Record<string, WorkerStatus> = {
	"agent.online": "idle",
	"agent.idle": "idle",
	"agent.busy": "busy",
	"agent.started": "busy",
	"agent.blocked": "blocked",
	"agent.offline": "offline",
};

function toWorkerRole(role: string): WorkerRole {
	const lower = role.toLowerCase();
	if (lower.includes("lead") || lower.includes("plan")) return "planner";
	if (lower.includes("review")) return "reviewer";
	if (lower.includes("writer") || lower.includes("junior")) return "writer";
	if (lower.includes("veteran") || lower.includes("coder")) return "specialist";
	return "researcher";
}

/**
 * Merge a C1 roster frame into the current snapshot. Existing node state
 * (status, task, tokens) is preserved when the roster only refreshes liveness;
 * brand-new agents join with an "idle" status.
 */
export function mergeC1Roster(
	snapshot: SwarmSnapshot | null,
	agents: readonly C1Agent[],
	clock: number,
): SwarmSnapshot {
	const base = snapshot ?? { nodes: [], pools: [], updatedAt: clock, source: "live" as const };
	const existing = new Map(base.nodes.map((node) => [node.id, node]));
	const nextNodes = agents.map((agent) => {
		const prev = existing.get(agent.tag);
		return {
			id: agent.tag,
			name: agent.name,
			role: agent.kind === "lead" ? ("planner" as WorkerRole) : toWorkerRole(agent.role),
			status: prev?.status ?? "idle",
			model: prev?.model ?? import.meta.env.DEV ? "dev-local" : "cloudflare-worker",
			task: prev?.task,
			tokensUsed: prev?.tokensUsed ?? 0,
			lastSeen: clock,
			joinedAt: prev?.joinedAt ?? clock,
		} satisfies WorkerNode;
	});
	return { nodes: nextNodes, pools: base.pools, updatedAt: clock, source: "live" };
}

/**
 * Map a C1 push event (payload of an SSE `event` frame) to a SwarmEvent, or
 * return null when it carries nothing the canvas renders. C1's emitStreamEvent
 * sends `{ type, ts, ...payload }`; we key on the `type` prefix.
 */
export function mapC1Event(payload: Record<string, unknown>, at: number): SwarmEvent | null {
	const type = typeof payload.type === "string" ? payload.type : "";
	if (type === "snapshot" && typeof payload.snapshot === "object" && payload.snapshot !== null) {
		return { type: "snapshot", snapshot: payload.snapshot as SwarmSnapshot };
	}
	const status = C1_EVENT_STATUS[type];
	const tag = typeof payload.tag === "string" ? payload.tag : null;
	if (status && tag) {
		return {
			type: "node_status",
			nodeId: tag,
			status,
			task: typeof payload.task === "string" ? payload.task : undefined,
			at,
		};
	}
	if (type === "pool.update" && typeof payload.pool === "object" && payload.pool !== null) {
		return { type: "pool_update", pool: payload.pool as TokenPool, at };
	}
	return null;
}
