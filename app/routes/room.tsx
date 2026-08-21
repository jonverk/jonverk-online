import { usePartySocket } from "partysocket/react";
import { nanoid } from "nanoid";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router";

import type { Route } from "./+types/room";
import {
	MAX_MESSAGE_LENGTH,
	MAX_NAME_LENGTH,
	type ChatMessage,
	type Message,
} from "../chat/shared";

export function meta({ params }: Route.MetaArgs) {
	return [
		{ title: `Room ${params.roomId} · Jonverk Online` },
		{ name: "description", content: "A shareable real-time chat room." },
	];
}

export default function Room() {
	const { roomId = "" } = useParams();
	const [name, setName] = useState("");
	const [nameDraft, setNameDraft] = useState("");
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [status, setStatus] = useState<"connecting" | "connected" | "reconnecting" | "offline">("connecting");
	const [copied, setCopied] = useState(false);
	const [content, setContent] = useState("");
	const messagesEndRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const savedName = localStorage.getItem("jonverk-chat-name") ?? "";
		setName(savedName.slice(0, MAX_NAME_LENGTH));
		setNameDraft(savedName.slice(0, MAX_NAME_LENGTH));
	}, []);

	const socket = usePartySocket({
		party: "chat",
		room: roomId,
		onOpen: () => setStatus("connected"),
		onClose: () => setStatus("reconnecting"),
		onError: () => setStatus("offline"),
		onMessage: (event) => {
			const message = JSON.parse(event.data as string) as Message;
			if (message.type === "all") {
				setMessages(message.messages);
				return;
			}
			setMessages((current) => {
				const existingIndex = current.findIndex((item) => item.id === message.id);
				const next = { id: message.id, content: message.content, user: message.user, role: message.role };
				if (existingIndex === -1) return [...current, next];
				return current.map((item, index) => index === existingIndex ? next : item);
			});
		},
	});

	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages]);

	const roomLabel = useMemo(() => roomId.slice(0, 6), [roomId]);

	function saveName(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const cleanName = nameDraft.trim().slice(0, MAX_NAME_LENGTH);
		if (!cleanName) return;
		localStorage.setItem("jonverk-chat-name", cleanName);
		setName(cleanName);
	}

	async function copyRoomLink() {
		await navigator.clipboard.writeText(window.location.href);
		setCopied(true);
		window.setTimeout(() => setCopied(false), 1800);
	}

	function sendMessage(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const cleanContent = content.trim().slice(0, MAX_MESSAGE_LENGTH);
		if (!cleanContent || !name || status !== "connected") return;
		const message: ChatMessage = { id: nanoid(8), content: cleanContent, user: name, role: "user" };
		setMessages((current) => [...current, message]);
		socket.send(JSON.stringify({ type: "add", ...message } satisfies Message));
		setContent("");
	}

	if (!name) {
		return (
			<main className="grid min-h-screen place-items-center bg-[#f7f7f5] px-6 text-[#171717]">
				<form onSubmit={saveName} className="w-full max-w-md rounded-[2rem] border border-black/10 bg-white p-8 shadow-2xl shadow-black/10">
					<Link to="/" className="text-sm text-black/45 hover:text-black">← Back home</Link>
					<p className="mt-12 text-sm font-medium uppercase tracking-[0.2em] text-[#6d78a8]">You’re joining a room</p>
					<h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em]">What should people call you?</h1>
					<label htmlFor="name" className="sr-only">Display name</label>
					<input id="name" value={nameDraft} onChange={(event) => setNameDraft(event.target.value)} maxLength={MAX_NAME_LENGTH} className="mt-8 h-14 w-full rounded-2xl border border-black/10 bg-[#f7f7f5] px-5 outline-none ring-[#6d78a8] focus:ring-2" placeholder="Display name" autoFocus required />
					<button className="mt-3 h-14 w-full rounded-2xl bg-[#171717] font-medium text-white transition hover:bg-black" type="submit">Enter room <span aria-hidden>→</span></button>
				</form>
			</main>
		);
	}

	return (
		<main className="min-h-screen bg-[#f7f7f5] px-4 py-4 text-[#171717] sm:px-6 sm:py-6">
			<div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-5xl flex-col overflow-hidden rounded-[2rem] border border-black/10 bg-white shadow-2xl shadow-black/10">
				<header className="flex flex-col gap-4 border-b border-black/10 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
					<div className="flex items-center gap-3"><Link to="/" className="grid h-9 w-9 place-items-center rounded-xl bg-[#171717] text-sm font-semibold text-white">J</Link><div><p className="text-sm font-semibold">Room / {roomLabel}</p><p className="mt-0.5 flex items-center gap-1.5 text-xs text-black/45"><span className={`h-2 w-2 rounded-full ${status === "connected" ? "bg-[#48b97c]" : status === "offline" ? "bg-[#e56a67]" : "bg-[#efbd54]"}`} />{status === "connected" ? "Live now" : status === "reconnecting" ? "Reconnecting…" : status === "offline" ? "Offline" : "Connecting…"}</p></div></div>
					<button onClick={copyRoomLink} className="rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-medium transition hover:bg-[#f7f7f5]">{copied ? "Link copied" : "Share room"} <span aria-hidden>↗</span></button>
				</header>

				<section className="flex flex-1 flex-col bg-[#fbfbfa]">
					<div className="flex-1 space-y-6 overflow-y-auto px-5 py-8 sm:px-10">
						{messages.length === 0 ? <div className="grid min-h-[20rem] place-items-center text-center"><div><div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#e5ebff] text-2xl">✦</div><h2 className="mt-5 text-lg font-semibold">This room is ready.</h2><p className="mt-2 max-w-xs text-sm leading-6 text-black/45">Share the link with someone and start a conversation that lives here.</p></div></div> : messages.map((message) => <article key={message.id} className={`flex ${message.user === name ? "justify-end" : "justify-start"}`}><div className={`max-w-[85%] sm:max-w-[65%] ${message.user === name ? "text-right" : "text-left"}`}><p className="mb-1 px-1 text-xs text-black/40">{message.user}</p><p className={`rounded-2xl px-4 py-3 text-sm leading-6 ${message.user === name ? "rounded-tr-sm bg-[#b9c8ff]" : "rounded-tl-sm bg-white shadow-sm ring-1 ring-black/5"}`}>{message.content}</p></div></article>)}
						<div ref={messagesEndRef} />
					</div>
					<div className="border-t border-black/10 bg-white p-4 sm:p-6"><form onSubmit={sendMessage} className="flex items-end gap-3"><label className="sr-only" htmlFor="message">Message</label><textarea id="message" value={content} onChange={(event) => setContent(event.target.value)} maxLength={MAX_MESSAGE_LENGTH} rows={1} placeholder={status === "connected" ? `Message as ${name}` : "Waiting for connection…"} className="min-h-12 flex-1 resize-none rounded-2xl border border-black/10 bg-[#f7f7f5] px-4 py-3 text-sm outline-none ring-[#6d78a8] focus:ring-2 disabled:opacity-50" disabled={status !== "connected"} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }} /><button type="submit" disabled={!content.trim() || status !== "connected"} className="h-12 rounded-2xl bg-[#171717] px-5 text-sm font-medium text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-35">Send</button></form><div className="mt-2 flex items-center justify-between px-1 text-[11px] text-black/35"><form onSubmit={saveName} className="flex items-center gap-2"><span>Joining as</span><input aria-label="Change display name" value={nameDraft} onChange={(event) => setNameDraft(event.target.value)} onBlur={(event) => { const cleanName = event.currentTarget.value.trim().slice(0, MAX_NAME_LENGTH); if (cleanName) { localStorage.setItem("jonverk-chat-name", cleanName); setName(cleanName); } }} maxLength={MAX_NAME_LENGTH} className="w-28 border-b border-black/15 bg-transparent py-1 outline-none focus:border-black/50" /></form><span>{content.length}/{MAX_MESSAGE_LENGTH}</span></div></div>
				</section>
			</div>
		</main>
	);
}
