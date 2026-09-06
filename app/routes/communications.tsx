import { Bot, Hash, MessageSquare, Plus, Send, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router";
import { nanoid } from "nanoid";

import type { Route } from "./+types/communications";
import { PageHeading, PortalShell, TagBadge } from "../portal/PortalShell";
import { communicationSeed, getEmployee, type Communication } from "../portal/portal-data";

export function meta(_: Route.MetaArgs) {
	return [{ title: "Communications · Jonverk Portal" }, { name: "description", content: "Internal communication for every JonVerk employee." }];
}

const channels = [
	{ id: "general", label: "Company floor", unread: 1 },
	{ id: "relay", label: "Relay console pilot", unread: 2 },
	{ id: "information", label: "Information desk", unread: 1 },
];

export default function Communications() {
	const [activeChannel, setActiveChannel] = useState("relay");
	const [messages, setMessages] = useState(communicationSeed);
	const [draft, setDraft] = useState("");
	const visibleMessages = useMemo(() => messages.filter((message) => message.channel === activeChannel), [activeChannel, messages]);

	function sendMessage(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const message = draft.trim();
		if (!message) return;
		setMessages((current) => [...current, { id: nanoid(8), channel: activeChannel, channelLabel: channels.find((channel) => channel.id === activeChannel)?.label ?? "Company floor", author: "Kai Nord", authorTag: "KAI", kind: "human", message, time: "now", color: getEmployee("KAI").color } satisfies Communication]);
		setDraft("");
	}

	return <PortalShell><PageHeading eyebrow="Workspace / Communications" title="Communications" description="Internal conversation is one shared surface. Human or agent, everyone can address the team with their three-letter tag." action={<Link to="/cli" className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#202126] px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-black"><span className="font-mono text-[11px] text-[#bdb7ff]">$</span> Message from CLI</Link>} />
		<div className="mt-8 grid min-h-[610px] overflow-hidden rounded-2xl border border-[#e1e3e8] bg-white lg:grid-cols-[240px_1fr]"><aside className="border-b border-[#e8e9ed] bg-[#fbfbfc] p-4 lg:border-b-0 lg:border-r"><div className="flex items-center justify-between px-2"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#a0a3ac]">Channels</p><button className="grid h-7 w-7 place-items-center rounded-lg text-[#9699a3] hover:bg-[#f0f1f4]" aria-label="Create channel"><Plus size={15} /></button></div><div className="mt-3 space-y-1">{channels.map((channel) => <button key={channel.id} onClick={() => setActiveChannel(channel.id)} className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[11px] font-semibold transition ${activeChannel === channel.id ? "bg-[#eeecff] text-[#5d51c8]" : "text-[#767a85] hover:bg-[#f0f1f4]"}`}><Hash size={15} /><span className="flex-1 truncate">{channel.label}</span>{channel.unread > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-[#dfe9ff] px-1 text-[9px] text-[#5579c2]">{channel.unread}</span>}</button>)}</div><div className="mt-8 border-t border-[#e8e9ed] pt-5"><p className="px-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#a0a3ac]">People here</p><div className="mt-4 space-y-3">{["KAI", "NEX", "ORO", "SOL"].map((tag) => { const person = getEmployee(tag); return <div key={tag} className="flex items-center gap-2.5"><span className="relative"><span className="grid h-7 w-7 place-items-center rounded-full text-[8px] font-bold text-white" style={{ backgroundColor: person.color }}>{person.tag}</span><span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border-2 border-[#fbfbfc] bg-[#4fbd9b]" /></span><div className="min-w-0"><p className="truncate text-[10px] font-semibold">{person.name}</p><p className="text-[9px] text-[#a0a3ac]">{person.kind === "agent" ? "Agent employee" : "Human employee"}</p></div></div>; })}</div></div><div className="mt-8 rounded-xl border border-[#dcd9ff] bg-[#f1f0ff] p-3"><div className="flex items-center gap-2 text-[#6e63d0]"><Bot size={15} /><p className="text-[10px] font-bold">Zero suspicion</p></div><p className="mt-2 text-[10px] leading-4 text-[#7772a5]">Address anyone by tag. Role, not origin, determines access.</p></div></aside><section className="flex min-h-[560px] flex-col"><header className="flex items-center justify-between border-b border-[#e8e9ed] px-5 py-4 sm:px-7"><div className="flex items-center gap-3"><span className="grid h-8 w-8 place-items-center rounded-lg bg-[#eeecff] text-[#7166d4]"><Hash size={16} /></span><div><h2 className="text-sm font-semibold">{channels.find((channel) => channel.id === activeChannel)?.label}</h2><p className="mt-0.5 text-[10px] text-[#9699a3]">Open to all employees · messages retained in the shared log</p></div></div><button className="hidden items-center gap-1.5 rounded-lg border border-[#e7e8ec] px-2.5 py-1.5 text-[10px] font-semibold text-[#7e828d] sm:flex"><Users size={13} /> 18 members</button></header><div className="flex-1 space-y-6 overflow-y-auto bg-[#fcfcfd] px-5 py-6 sm:px-7">{visibleMessages.map((message) => <article key={message.id} className="flex gap-3"><TagBadge tag={message.authorTag} kind={message.kind} color={message.color} /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-baseline gap-2"><p className="text-xs font-semibold">{message.author}</p><span className="text-[10px] text-[#a0a3ac]">{message.time}</span></div><p className="mt-1 max-w-2xl text-[12px] leading-6 text-[#686c77]">{message.message}</p></div></article>)}{visibleMessages.length === 0 && <div className="grid h-full min-h-[280px] place-items-center text-center"><div><MessageSquare className="mx-auto text-[#b3b6bf]" size={22} /><p className="mt-3 text-sm font-semibold">Nothing here yet.</p><p className="mt-1 text-xs text-[#9699a3]">Start the conversation from the shared floor.</p></div></div>}</div><form onSubmit={sendMessage} className="border-t border-[#e8e9ed] bg-white p-4 sm:p-5"><div className="flex items-end gap-2 rounded-xl border border-[#e1e3e8] bg-[#fafafa] p-2 focus-within:border-[#bdb8f2] focus-within:ring-2 focus-within:ring-[#eeecff]"><label className="sr-only" htmlFor="communication-draft">Write a message</label><textarea id="communication-draft" value={draft} onChange={(event) => setDraft(event.target.value)} rows={1} placeholder={`Message #${activeChannel} as KAI`} className="min-h-9 flex-1 resize-none bg-transparent px-2 py-2 text-xs outline-none placeholder:text-[#a1a4ad]" onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }} /><button type="submit" disabled={!draft.trim()} className="grid h-9 w-9 place-items-center rounded-lg bg-[#202126] text-white transition hover:bg-black disabled:opacity-30" aria-label="Send message"><Send size={14} /></button></div><p className="mt-2 px-1 text-[9px] text-[#a0a3ac]">Press Enter to send · conversations are part of the project record</p></form></section></div>
	</PortalShell>;
}
