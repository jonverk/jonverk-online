import { nanoid } from "nanoid";
import { useState } from "react";
import { Link, useNavigate } from "react-router";

import type { Route } from "./+types/home";
import { MAX_NAME_LENGTH } from "../chat/shared";

export function meta(_: Route.MetaArgs) {
	return [
		{ title: "Jonverk Online" },
		{ name: "description", content: "A quiet place to talk in real time." },
	];
}

export default function Home(_: Route.ComponentProps) {
	const navigate = useNavigate();
	const [name, setName] = useState("");

	function createRoom(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const cleanName = name.trim().slice(0, MAX_NAME_LENGTH);
		if (!cleanName) return;
		localStorage.setItem("jonverk-chat-name", cleanName);
		navigate(`/${nanoid(10)}`);
	}

	return (
		<main className="relative min-h-screen overflow-hidden bg-[#f7f7f5] text-[#171717]">
			<div className="pointer-events-none absolute -left-32 -top-40 h-96 w-96 rounded-full bg-[#d9e8ff] blur-3xl" />
			<div className="pointer-events-none absolute -bottom-48 -right-20 h-[32rem] w-[32rem] rounded-full bg-[#f6d7d0] blur-3xl" />
			<div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col border border-dashed px-6 py-8 sm:px-10 lg:px-16">
				<header className="flex items-center justify-between">
					<div className="flex items-center gap-3 text-sm font-semibold tracking-tight">
						<span className="grid h-9 w-9 place-items-center rounded-xl bg-[#171717] text-white shadow-sm">J</span>
						<span>jonverk.online</span>
					</div>
					<div className="flex items-center gap-2">
						<span className="rounded-full border border-black/10 bg-white/60 px-3 py-1.5 text-xs text-black/60">Open rooms · no accounts</span>
						<Link to="/wiki" className="rounded-full border border-black/10 bg-white/60 px-3 py-1.5 text-xs font-medium text-black/70 transition hover:bg-white hover:text-black">Wiki</Link>
					</div>
				</header>

				<section className="grid flex-1 items-center gap-14 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20">
					<div className="max-w-xl">
						<p className="mb-5 text-sm font-medium uppercase tracking-[0.22em] text-[#6d78a8]">A room for the moment</p>
						<h1 className="border border-groove text-center font-architects-daughter text-5xl font-semibold leading-[0.98] tracking-[-0.055em] text-[rgba(250,0,245,1)] opacity-[0.34] shadow-[1px_1px_3px_0_rgba(0,0,0,1)] sm:text-7xl">Talk together, wherever you are.</h1>
						<p className="mt-7 mr-auto max-w-md border border-hidden font-architects-daughter text-lg leading-8 text-black/55">Start a private-by-link room, share the URL, and let the conversation unfold in real time.</p>
						<form onSubmit={createRoom} className="mt-10 flex max-w-md flex-col gap-3 sm:flex-row">
							<label className="sr-only" htmlFor="name">Your display name</label>
							<input id="name" name="name" value={name} onChange={(event) => setName(event.target.value)} maxLength={MAX_NAME_LENGTH} placeholder="Choose a display name" className="h-14 flex-1 rounded-2xl border border-black/10 bg-white/80 px-5 text-base outline-none ring-[#6d78a8] transition placeholder:text-black/35 focus:ring-2" autoComplete="nickname" required />
							<button type="submit" className="h-14 rounded-2xl bg-[#171717] px-6 font-medium text-white shadow-lg shadow-black/10 transition hover:-translate-y-0.5 hover:bg-black disabled:cursor-not-allowed disabled:opacity-40" disabled={!name.trim()}>Create a room <span aria-hidden>→</span></button>
						</form>
					</div>

					<div className="relative mx-auto w-full max-w-md">
						<div className="rotate-[-4deg] rounded-[2rem] border border-black/10 bg-white/80 p-4 shadow-2xl shadow-black/10 backdrop-blur">
							<div className="rounded-[1.4rem] bg-[#171717] p-5 text-white">
								<div className="flex items-center justify-between text-xs text-white/45"><span>room / morning-glow</span><span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#8de7b5]" /> live</span></div>
								<div className="mt-12 space-y-5">
									<div><p className="text-xs text-white/40">Mara · 09:41</p><p className="mt-1 max-w-[15rem] rounded-2xl rounded-tl-sm bg-white/10 px-4 py-3 text-sm leading-6">The light is perfect today.</p></div>
									<div className="ml-auto max-w-[15rem] text-right"><p className="text-xs text-white/40">You · 09:42</p><p className="mt-1 rounded-2xl rounded-tr-sm bg-[#b9c8ff] px-4 py-3 text-left text-sm leading-6 text-[#171717]">Then this is a good place to stay awhile.</p></div>
								</div>
								<div className="mt-10 flex items-center gap-2 rounded-xl bg-white/10 px-3 py-3 text-xs text-white/35"><span className="flex-1">Write a message...</span><span className="rounded-lg bg-white/15 px-3 py-1.5 text-white/70">Send</span></div>
							</div>
						</div>
						<div className="absolute -bottom-8 -left-8 rounded-2xl border border-black/10 bg-[#fff3c7] px-4 py-3 text-xs font-medium shadow-xl shadow-black/10">Shared by link ✦</div>
					</div>
				</section>

				<footer className="flex flex-col gap-2 border-t border-black/10 pt-5 text-xs text-black/40 sm:flex-row sm:items-center sm:justify-between"><span>Real-time chat, backed by Cloudflare Durable Objects.</span><span>Made for small conversations.</span></footer>
			</div>
		</main>
	);
}
