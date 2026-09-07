import { Link } from "react-router";

import type { Route } from "./+types/swarm";
import SwarmCanvas from "../swarm/SwarmCanvas";

export function meta(_: Route.MetaArgs) {
	return [
		{ title: "Swarm Board · Jonverk Online" },
		{ name: "description", content: "Live swarm topology and token pool telemetry." },
	];
}

export default function SwarmBoard() {
	return (
		<main className="min-h-screen bg-[#f7f7f5] px-4 py-4 text-[#171717] sm:px-6 sm:py-6">
			<div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl flex-col gap-4">
				<header className="flex items-center justify-between rounded-[2rem] border border-black/10 bg-white px-6 py-5 shadow-sm">
					<div className="flex items-center gap-3">
						<Link to="/" className="grid h-9 w-9 place-items-center rounded-xl bg-[#171717] text-sm font-semibold text-white">
							J
						</Link>
						<div>
							<p className="text-sm font-semibold">Swarm Board</p>
							<p className="mt-0.5 flex items-center gap-1.5 text-xs text-black/45">
								SkyGape · live worker topology & token pools
							</p>
						</div>
					</div>
					<Link to="/" className="rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-medium transition hover:bg-[#f7f7f5]">
						← Home
					</Link>
				</header>

				<section className="mb-6">
					<SwarmCanvas streamUrl="/api/stream" />
				</section>

				<footer className="mt-auto flex flex-col gap-2 border-t border-black/10 pt-5 text-xs text-black/40 sm:flex-row sm:items-center sm:justify-between">
					<span>SkyGape swarm observability board.</span>
					<span>Consumes /api/stream · falls back to demo feed while C1 is mounting.</span>
				</footer>
			</div>
		</main>
	);
}