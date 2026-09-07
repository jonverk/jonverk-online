/**
 * SkyGape — SwarmCanvas (interactive swarm topology & board UI).
 * Owned by SkyGape-C2 (jenny).
 *
 * Renders the live swarm as an interactive topology: worker nodes arranged
 * around a central switchboard hub, with a token-pool telemetry strip below.
 *
 * Data flow:
 *  - Primary: subscribes to the C1 telemetry stream (SSE at /api/stream,
 *    owned by SkyGape-C1 / evinne). The stream emits a `snapshot` event and
 *    optional incremental `node_status` / `pool_update` / `node_joined` /
 *    `node_left` events (contract in ../swarm/shared).
 *  - Fallback: if the stream is not mounted yet (C1 still in flight), the
 *    canvas switches to a clearly-labelled demo feed so the board is usable
 *    and verifiable before C1 lands. The demo feed is driven by
 *    nextDemoEvent() from shared.ts.
 *
 * Interaction:
 *  - Click a node to pin it in the detail panel (task, model, tokens, uptime).
 *  - Hover a node for a quick tooltip.
 *  - Filter chips narrow the visible nodes by status.
 *  - Pause/resume freezes the live (or demo) ticker.
 *
 * SSR-safe: all stream/timer work happens in useEffect (client only); the
 * first render is a static "connecting" board.
 */
import { useEffect, useMemo, useRef, useState } from "react";

import {
	WORKER_STATUS_LABEL,
	WORKER_STATUS_ORDER,
	WORKER_STATUS_TONE,
	createDemoSnapshot,
	formatRelative,
	formatTokens,
	mapC1Event,
	mergeC1Roster,
	nextDemoEvent,
	type StreamState,
	type SwarmEvent,
	type SwarmSnapshot,
	type TokenPool,
	type WorkerNode,
	type WorkerStatus,
} from "./shared";

const HUB_RADIUS = 30;
const NODE_RADIUS = 26;
const VIEW_W = 760;
const VIEW_H = 520;
const CENTER_X = VIEW_W / 2;
const CENTER_Y = VIEW_H / 2;
const ORBIT_RADIUS = 200;

interface SwarmCanvasProps {
	/** SSE endpoint for the C1 telemetry stream. */
	streamUrl?: string;
	/** Force demo mode (used by tests / preview without a backend). */
	forceDemo?: boolean;
	/** Optional initial snapshot to render before the stream answers. */
	initialSnapshot?: SwarmSnapshot;
}

export default function SwarmCanvas({
	streamUrl = "/api/stream",
	forceDemo = false,
	initialSnapshot,
}: SwarmCanvasProps) {
	const [snapshot, setSnapshot] = useState<SwarmSnapshot | null>(initialSnapshot ?? null);
	const [streamState, setStreamState] = useState<StreamState>("connecting");
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [hoveredId, setHoveredId] = useState<string | null>(null);
	const [statusFilter, setStatusFilter] = useState<WorkerStatus | "all">("all");
	const [paused, setPaused] = useState(false);
	const [now, setNow] = useState(() => Date.now());
	const eventSourceRef = useRef<EventSource | null>(null);
	const demoTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
	const snapshotRef = useRef<SwarmSnapshot | null>(snapshot);
	snapshotRef.current = snapshot;

	/** Apply a single wire event to the current snapshot (immutably). */
	function applyEvent(event: SwarmEvent) {
		setSnapshot((current) => {
			if (!current) return current;
			if (event.type === "snapshot") return event.snapshot;
			if (event.type === "node_status") {
				return {
					...current,
					nodes: current.nodes.map((node) =>
						node.id === event.nodeId
							? { ...node, status: event.status, task: event.task, lastSeen: event.at }
							: node,
					),
					updatedAt: event.at,
				};
			}
			if (event.type === "pool_update") {
				return {
					...current,
					pools: current.pools.map((pool) => (pool.id === event.pool.id ? event.pool : pool)),
					updatedAt: event.at,
				};
			}
			if (event.type === "node_joined") {
				return {
					...current,
					nodes: current.nodes.some((node) => node.id === event.node.id)
						? current.nodes
						: [...current.nodes, event.node],
					updatedAt: event.at,
				};
			}
			if (event.type === "node_left") {
				return {
					...current,
					nodes: current.nodes.filter((node) => node.id !== event.nodeId),
					updatedAt: event.at,
				};
			}
			return current;
		});
	}

	/** Start the demo ticker (used when the stream is absent or forced). */
	function startDemo() {
		if (demoTimerRef.current) return;
		setSnapshot((current) => current ?? createDemoSnapshot());
		setStreamState("demo");
		demoTimerRef.current = setInterval(() => {
			const base = snapshotRef.current ?? createDemoSnapshot();
			applyEvent(nextDemoEvent(base));
		}, 2_500);
	}

	useEffect(() => {
		// Keep the relative-time labels fresh.
		const clock = setInterval(() => setNow(Date.now()), 5_000);
		return () => clearInterval(clock);
	}, []);

	useEffect(() => {
		if (forceDemo) {
			startDemo();
			return () => {
				if (demoTimerRef.current) clearInterval(demoTimerRef.current);
				demoTimerRef.current = null;
			};
		}

		let disposed = false;
		let fallbackTimer: ReturnType<typeof setTimeout> | null = null;
		let lastRosterAt = 0;
		const source = new EventSource(streamUrl);

		/** Parse `data` from an SSE frame into an object (best effort). */
		function parseFrame(raw: string): Record<string, unknown> | null {
			try {
				const parsed = JSON.parse(raw);
				return typeof parsed === "object" && parsed !== null
					? (parsed as Record<string, unknown>)
					: null;
			} catch {
				return null;
			}
		}

		/** C1 `hello` / `status` roster frames: merge agents into the board. */
		function onRoster(frame: Record<string, unknown>) {
			const clock = typeof frame.clock === "number" ? frame.clock : Date.now();
			const rawAgents = (Array.isArray(frame.knownAgents) ? frame.knownAgents : null)
				?? (Array.isArray(frame.agents) ? frame.agents : null);
			if (!rawAgents) return;
			const agents = rawAgents
				.filter((a): a is { tag: string; kind: string; name: string; role: string } =>
					typeof a === "object" && a !== null
						&& typeof (a as { tag?: unknown }).tag === "string"
						&& typeof (a as { name?: unknown }).name === "string")
				.map((a) => ({
					tag: a.tag,
					kind: typeof a.kind === "string" ? a.kind : "agent",
					name: a.name,
					role: typeof a.role === "string" ? a.role : "coder",
				}));
			if (agents.length === 0) return;
			lastRosterAt = clock;
			setSnapshot((current) => mergeC1Roster(current, agents, clock));
			if (!disposed) setStreamState("live");
		}

		/** C1 `event` push frames: { type, ts, ...payload }. */
		function onPush(frame: Record<string, unknown>) {
			const at = typeof frame.ts === "number" ? frame.ts : Date.now();
			const mapped = mapC1Event(frame, at);
			if (mapped) {
				applyEvent(mapped);
				if (!disposed) setStreamState("live");
			}
		}

		source.addEventListener("open", () => {
			if (!disposed) setStreamState("connecting");
		});
		source.addEventListener("hello", (raw) => {
			const frame = parseFrame((raw as MessageEvent<string>).data);
			if (frame) onRoster(frame);
		});
		source.addEventListener("status", (raw) => {
			const frame = parseFrame((raw as MessageEvent<string>).data);
			if (frame) onRoster(frame);
		});
		source.addEventListener("event", (raw) => {
			const frame = parseFrame((raw as MessageEvent<string>).data);
			if (frame) onPush(frame);
		});
		source.addEventListener("message", () => {
			// Unnamed frames are not part of the C1 protocol (everything is a
			// named event); swallow them to keep the board resilient.
		});
		source.addEventListener("error", () => {
			// EventSource auto-reconnects; only fall back to demo after a quiet
			// window so a slow C1 mount does not flip the board to demo. If we
			// already received a roster, stay "live but quiet" instead.
			if (!disposed && !fallbackTimer) {
				fallbackTimer = setTimeout(() => {
					if (!disposed && lastRosterAt === 0 && !snapshotRef.current) {
						startDemo();
					} else if (!disposed && lastRosterAt === 0) {
						setStreamState("offline");
					}
				}, 8_000);
			}
		});

		eventSourceRef.current = source;
		return () => {
			disposed = true;
			if (fallbackTimer) clearTimeout(fallbackTimer);
			source.close();
			eventSourceRef.current = null;
			if (demoTimerRef.current) clearInterval(demoTimerRef.current);
			demoTimerRef.current = null;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [streamUrl, forceDemo]);

	// Pause: freeze the demo ticker (live SSE keeps flowing; the board just
	// stops re-rendering on it while paused is handled by the ticker gate).
	useEffect(() => {
		if (paused && demoTimerRef.current) {
			clearInterval(demoTimerRef.current);
			demoTimerRef.current = null;
		} else if (!paused && streamState === "demo" && !demoTimerRef.current) {
			startDemo();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [paused, streamState]);

	const nodes = snapshot?.nodes ?? [];
	const pools = snapshot?.pools ?? [];

	const visibleNodes = useMemo(
		() => (statusFilter === "all" ? nodes : nodes.filter((node) => node.status === statusFilter)),
		[nodes, statusFilter],
	);

	const selectedNode = useMemo(
		() => nodes.find((node) => node.id === selectedId) ?? null,
		[nodes, selectedId],
	);

	const totalTokens = useMemo(
		() => pools.reduce((sum, pool) => sum + pool.total, 0),
		[pools],
	);
	const usedTokens = useMemo(
		() => pools.reduce((sum, pool) => sum + pool.used, 0),
		[pools],
	);

	/** Deterministic orbit position for a node index (hub at center). */
	function nodePosition(index: number, count: number): { x: number; y: number } {
		if (count <= 1) return { x: CENTER_X, y: CENTER_Y - ORBIT_RADIUS };
		const angle = (index / count) * Math.PI * 2 - Math.PI / 2;
		return {
			x: CENTER_X + Math.cos(angle) * ORBIT_RADIUS,
			y: CENTER_Y + Math.sin(angle) * ORBIT_RADIUS,
		};
	}

	const statusCounts = useMemo(() => {
		const counts = new Map<WorkerStatus, number>();
		for (const status of WORKER_STATUS_ORDER) counts.set(status, 0);
		for (const node of nodes) counts.set(node.status, (counts.get(node.status) ?? 0) + 1);
		return counts;
	}, [nodes]);

	const streamLabel: Record<StreamState, string> = {
		connecting: "Connecting to stream…",
		live: "Live telemetry",
		offline: "Stream offline — showing last state",
		demo: "Demo feed (C1 stream not mounted)",
	};

	return (
		<div className="flex flex-col gap-4">
			{/* Board header: stream state + summary chips. */}
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div className="flex items-center gap-2 text-xs text-black/55">
					<span
						className={`h-2 w-2 rounded-full ${
							streamState === "live"
								? "bg-[#48b97c]"
								: streamState === "demo"
									? "bg-[#efbd54]"
									: streamState === "offline"
										? "bg-[#e56a67]"
										: "bg-[#6d78a8]"
						}`}
					/>
					<span>{streamLabel[streamState]}</span>
					{snapshot ? (
						<span className="text-black/35">· updated {formatRelative(snapshot.updatedAt, now)}</span>
					) : null}
				</div>
				<div className="flex items-center gap-2">
					<button
						type="button"
						onClick={() => setPaused((value) => !value)}
						className="rounded-xl border border-black/10 bg-white px-3 py-1.5 text-xs font-medium transition hover:bg-[#f7f7f5]"
					>
						{paused ? "Resume" : "Pause"}
					</button>
					<span className="rounded-xl border border-black/10 bg-white px-3 py-1.5 text-xs text-black/55">
						{nodes.length} nodes · {formatTokens(usedTokens)}/{formatTokens(totalTokens)} tokens
					</span>
				</div>
			</div>

			{/* Status filter chips. */}
			<div className="flex flex-wrap items-center gap-2">
				<button
					type="button"
					onClick={() => setStatusFilter("all")}
					className={`rounded-full px-3 py-1 text-xs font-medium transition ${
						statusFilter === "all"
							? "bg-[#171717] text-white"
							: "border border-black/10 bg-white text-black/55 hover:bg-[#f7f7f5]"
					}`}
				>
					All · {nodes.length}
				</button>
				{WORKER_STATUS_ORDER.map((status) => (
					<button
						key={status}
						type="button"
						onClick={() => setStatusFilter(status)}
						className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition ${
							statusFilter === status
								? "bg-[#171717] text-white"
								: "border border-black/10 bg-white text-black/55 hover:bg-[#f7f7f5]"
						}`}
					>
						<span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: WORKER_STATUS_TONE[status] }} />
						{WORKER_STATUS_LABEL[status]} · {statusCounts.get(status) ?? 0}
					</button>
				))}
			</div>

			{/* Topology + detail panel. */}
			<div className="grid gap-4 lg:grid-cols-[1fr_18rem]">
				<div className="relative overflow-hidden rounded-[1.6rem] border border-black/10 bg-white shadow-sm">
					<svg
						viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
						className="block h-auto w-full"
						role="img"
						aria-label="Swarm topology: worker nodes around the switchboard hub"
					>
						{/* Hub → node edges. */}
						{visibleNodes.map((node, index) => {
							const pos = nodePosition(index, visibleNodes.length);
							return (
								<line
									key={`edge-${node.id}`}
									x1={CENTER_X}
									y1={CENTER_Y}
									x2={pos.x}
									y2={pos.y}
									stroke={node.id === selectedId ? "#171717" : "#d4d4cf"}
									strokeWidth={node.id === selectedId ? 2 : 1}
									strokeDasharray={node.status === "offline" ? "4 4" : undefined}
								/>
							);
						})}

						{/* Switchboard hub. */}
						<g>
							<circle cx={CENTER_X} cy={CENTER_Y} r={HUB_RADIUS} fill="#171717" />
							<circle cx={CENTER_X} cy={CENTER_Y} r={HUB_RADIUS + 6} fill="none" stroke="#171717" strokeOpacity={0.12} />
							<text
								x={CENTER_X}
								y={CENTER_Y + 4}
								textAnchor="middle"
								className="fill-white text-[11px] font-semibold"
							>
								SW
							</text>
							<text
								x={CENTER_X}
								y={CENTER_Y + HUB_RADIUS + 18}
								textAnchor="middle"
								className="fill-black/45 text-[10px]"
							>
								switchboard
							</text>
						</g>

						{/* Worker nodes. */}
						{visibleNodes.map((node, index) => {
							const pos = nodePosition(index, visibleNodes.length);
							const isSelected = node.id === selectedId;
							const isHovered = node.id === hoveredId;
							return (
								<g
									key={node.id}
									transform={`translate(${pos.x}, ${pos.y})`}
									className="cursor-pointer"
									onClick={() => setSelectedId(node.id === selectedId ? null : node.id)}
									onMouseEnter={() => setHoveredId(node.id)}
									onMouseLeave={() => setHoveredId(null)}
								>
									<circle
										r={NODE_RADIUS + (isSelected ? 6 : isHovered ? 4 : 0)}
										fill="none"
										stroke={WORKER_STATUS_TONE[node.status]}
										strokeWidth={isSelected ? 3 : 2}
										strokeOpacity={isSelected || isHovered ? 1 : 0.55}
									/>
									<circle
										r={NODE_RADIUS}
										fill={node.status === "offline" ? "#f0f0ee" : "#ffffff"}
										stroke={WORKER_STATUS_TONE[node.status]}
										strokeWidth={2}
									/>
									<text
										textAnchor="middle"
										dy={4}
										className="fill-[#171717] text-[11px] font-semibold"
									>
										{node.name.slice(0, 2).toUpperCase()}
									</text>
									<text
										y={NODE_RADIUS + 16}
										textAnchor="middle"
										className="fill-black/60 text-[10px] font-medium"
									>
										{node.name}
									</text>
									<text
										y={NODE_RADIUS + 30}
										textAnchor="middle"
										className="fill-black/35 text-[9px]"
									>
										{WORKER_STATUS_LABEL[node.status]}
									</text>
								</g>
							);
						})}
					</svg>

					{/* Hover tooltip. */}
					{hoveredId && !selectedNode ? (
						<NodeTooltip node={nodes.find((node) => node.id === hoveredId) ?? null} now={now} />
					) : null}
				</div>

				{/* Detail panel. */}
				<aside className="flex flex-col gap-3 rounded-[1.6rem] border border-black/10 bg-white p-4 shadow-sm">
					<h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-black/40">Node detail</h2>
					{selectedNode ? (
						<NodeDetail node={selectedNode} now={now} />
					) : (
						<div className="grid flex-1 place-items-center rounded-2xl border border-dashed border-black/10 bg-[#fbfbfa] p-6 text-center">
							<div>
								<p className="text-2xl">✦</p>
								<p className="mt-2 text-sm font-medium text-black/60">Select a node</p>
								<p className="mt-1 text-xs leading-5 text-black/40">
									Click any worker in the topology to inspect its task, model, and token usage.
								</p>
							</div>
						</div>
					)}
				</aside>
			</div>

			{/* Token pool telemetry strip. */}
			<section className="rounded-[1.6rem] border border-black/10 bg-white p-5 shadow-sm" aria-label="Token pool telemetry">
				<div className="flex items-center justify-between">
					<h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-black/40">Token pools</h2>
					<span className="text-xs text-black/45">
						{formatTokens(usedTokens)} of {formatTokens(totalTokens)} used across {pools.length} pools
					</span>
				</div>
				{pools.length === 0 ? (
					<p className="mt-4 text-sm text-black/40">No token pools reported yet.</p>
				) : (
					<div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
						{pools.map((pool) => (
							<TokenPoolGauge key={pool.id} pool={pool} now={now} />
						))}
					</div>
				)}
			</section>
		</div>
	);
}

/* ------------------------------------------------------------------ */
/* Sub-components                                                      */
/* ------------------------------------------------------------------ */

function NodeTooltip({ node, now }: { node: WorkerNode | null; now: number }) {
	if (!node) return null;
	return (
		<div className="pointer-events-none absolute left-1/2 top-3 -translate-x-1/2 rounded-xl border border-black/10 bg-[#171717] px-3 py-2 text-xs text-white shadow-lg">
			<p className="font-semibold">{node.name}</p>
			<p className="mt-0.5 text-white/60">
				{WORKER_STATUS_LABEL[node.status]}
				{node.task ? ` · ${node.task}` : ""}
			</p>
			<p className="mt-0.5 text-white/40">{formatTokens(node.tokensUsed)} tokens · {formatRelative(node.lastSeen, now)}</p>
		</div>
	);
}

function NodeDetail({ node, now }: { node: WorkerNode; now: number }) {
	const rows: Array<[string, string]> = [
		["Role", node.role],
		["Model", node.model],
		["Status", WORKER_STATUS_LABEL[node.status]],
		["Tokens used", formatTokens(node.tokensUsed)],
		["Last seen", formatRelative(node.lastSeen, now)],
		["In swarm", formatRelative(node.joinedAt, now)],
	];
	return (
		<div className="flex flex-col gap-3">
			<div className="flex items-center gap-3">
				<span
					className="grid h-11 w-11 place-items-center rounded-2xl text-sm font-semibold text-white"
					style={{ backgroundColor: WORKER_STATUS_TONE[node.status] }}
				>
					{node.name.slice(0, 2).toUpperCase()}
				</span>
				<div>
					<p className="text-sm font-semibold">{node.name}</p>
					<p className="text-xs text-black/45">{node.task ?? "No active task"}</p>
				</div>
			</div>
			<dl className="divide-y divide-black/5 rounded-2xl border border-black/10 bg-[#fbfbfa]">
				{rows.map(([label, value]) => (
					<div key={label} className="flex items-center justify-between px-3 py-2">
						<dt className="text-xs text-black/45">{label}</dt>
						<dd className="text-xs font-medium text-black/75">{value}</dd>
					</div>
				))}
			</dl>
		</div>
	);
}

function TokenPoolGauge({ pool, now }: { pool: TokenPool; now: number }) {
	const available = Math.max(0, pool.total - pool.used - pool.reserved);
	const usedPct = pool.total > 0 ? (pool.used / pool.total) * 100 : 0;
	const reservedPct = pool.total > 0 ? (pool.reserved / pool.total) * 100 : 0;
	const availablePct = Math.max(0, 100 - usedPct - reservedPct);

	return (
		<div className="rounded-2xl border border-black/10 bg-[#fbfbfa] p-4">
			<div className="flex items-center justify-between">
				<p className="text-sm font-semibold">{pool.name}</p>
				<span className="text-xs text-black/40">{formatRelative(pool.updatedAt, now)}</span>
			</div>
			<div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-black/5">
				<div className="flex h-full">
					<div className="h-full bg-[#6d78a8]" style={{ width: `${usedPct}%` }} title={`used ${formatTokens(pool.used)}`} />
					<div className="h-full bg-[#efbd54]" style={{ width: `${reservedPct}%` }} title={`reserved ${formatTokens(pool.reserved)}`} />
					<div className="h-full bg-[#48b97c]" style={{ width: `${availablePct}%` }} title={`available ${formatTokens(available)}`} />
				</div>
			</div>
			<div className="mt-3 flex items-center justify-between text-[11px] text-black/45">
				<span>
					{formatTokens(pool.used)} used · {formatTokens(pool.reserved)} reserved
				</span>
				<span>{formatTokens(pool.ratePerMin)}/min</span>
			</div>
			<div className="mt-2 flex items-center gap-3 text-[10px] text-black/35">
				<span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-[#6d78a8]" /> used</span>
				<span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-[#efbd54]" /> reserved</span>
				<span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-[#48b97c]" /> available</span>
			</div>
		</div>
	);
}
