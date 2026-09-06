import { ArrowUpRight, Bot, Check, ChevronRight, Command, Copy, HelpCircle, RotateCcw, Send, Terminal, UserRound } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";

import type { Route } from "./+types/cli";
import { PageHeading, PortalShell } from "../portal/PortalShell";
import { commandHistorySeed, getEmployee, projects } from "../portal/portal-data";

type HistoryEntry = { command: string; output: string; time?: string };

export function meta(_: Route.MetaArgs) {
	return [{ title: "CLI console · Jonverk Portal" }, { name: "description", content: "Command surface for JonVerk communication and control." }];
}

const commandExamples = ["help", "roster", "projects", "tasks ATLAS-04", "move at-2 review", "assign re-4 ORO", "msg #relay hello", "ask ORO \"what changed in Atlas?\""];

export default function Cli() {
	const [history, setHistory] = useState<HistoryEntry[]>(commandHistorySeed);
	const [command, setCommand] = useState("");
	const [copied, setCopied] = useState(false);

	function runCommand(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const raw = command.trim();
		if (!raw) return;
		const lower = raw.toLowerCase();
		let output = "Command accepted. The shared activity stream has been updated.";
		if (lower === "help") output = "help  roster  projects  tasks  move  assign  new  plan  msg  ask";
		else if (lower === "roster") output = "06 online · KAI human · MIR agent · SOL human · NEX agent · IVA human · ORO agent";
		else if (lower === "projects") output = "ATLAS-04 on track 68% · RELAY-02 at risk 44% · HARBOR-07 on track 82%";
		else if (lower.startsWith("tasks")) output = "ATLAS-04 · 1 backlog · 1 in progress · 1 review · 1 done";
		else if (lower.startsWith("ask")) output = "ORO: Atlas recall testing is 19/24 passing. The remaining questions need provenance links.";
		else if (lower.startsWith("move")) output = "Moved the task and posted the change to the project board and activity log.";
		else if (lower.startsWith("assign")) output = "Assignment updated. The new owner has been notified in the project room.";
		else if (lower.startsWith("msg")) output = "Message posted to the shared channel. 04 colleagues can see it now.";
		setHistory((current) => [...current, { command: `KAI $ ${raw}`, output, time: "now" }]);
		setCommand("");
	}

	async function copyPrompt() {
		await navigator.clipboard.writeText("ask ORO \\\"what changed in Atlas?\\\"");
		setCopied(true);
		window.setTimeout(() => setCopied(false), 1600);
	}

	return <PortalShell><PageHeading eyebrow="Control surface / CLI" title="Relay console" description="The backbone for communication and control. Commands work for every employee identity and leave a shared trail." action={<div className="flex items-center gap-2 rounded-xl border border-[#e1e3e8] bg-white px-3 py-2 text-[10px] font-semibold text-[#797d88]"><span className="h-2 w-2 rounded-full bg-[#4fbd9b]" /> DB connected</div>} />
		<div className="mt-8 grid gap-5 xl:grid-cols-[1fr_310px]"><section className="overflow-hidden rounded-2xl border border-[#2f3036] bg-[#202126] shadow-xl shadow-[#202126]/10"><header className="flex items-center justify-between border-b border-white/10 px-5 py-4"><div className="flex items-center gap-2.5"><span className="grid h-8 w-8 place-items-center rounded-lg bg-[#34353c] text-[#bbb4ff]"><Terminal size={15} /></span><div><p className="text-xs font-semibold text-white">jonverk relay</p><p className="mt-0.5 text-[10px] text-white/35">shared company workspace · KAI</p></div></div><div className="flex items-center gap-2 text-[10px] text-white/35"><span className="h-1.5 w-1.5 rounded-full bg-[#4fbd9b]" /> live <button className="ml-2 text-white/35 hover:text-white" onClick={() => setHistory(commandHistorySeed)} aria-label="Reset command history"><RotateCcw size={14} /></button></div></header><div className="min-h-[395px] space-y-5 overflow-y-auto px-5 py-6 font-mono text-[11px] sm:px-7">{history.map((entry, index) => <div key={`${entry.command}-${index}`}><p className="text-[#bdb7ff]">{entry.command}</p><p className="mt-1 max-w-3xl leading-6 text-white/65"><span className="mr-2 text-[#4fbd9b]">→</span>{entry.output}</p></div>)}<div className="flex items-center gap-2 text-[#bdb7ff]"><span>KAI $</span><span className="h-4 w-px animate-pulse bg-[#bdb7ff]" /></div></div><form onSubmit={runCommand} className="flex items-center gap-3 border-t border-white/10 bg-[#1c1d21] px-5 py-4 sm:px-7"><label className="font-mono text-xs text-[#bdb7ff]" htmlFor="cli-input">KAI $</label><input id="cli-input" autoFocus value={command} onChange={(event) => setCommand(event.target.value)} className="min-w-0 flex-1 bg-transparent font-mono text-xs text-white outline-none placeholder:text-white/25" placeholder="type a command…" autoComplete="off" /><button type="submit" disabled={!command.trim()} className="grid h-8 w-8 place-items-center rounded-lg bg-[#756ad9] text-white disabled:opacity-30" aria-label="Run command"><Send size={13} /></button></form></section><aside className="space-y-5"><section className="rounded-2xl border border-[#e1e3e8] bg-white p-5"><div className="flex items-center gap-2"><HelpCircle size={16} className="text-[#756ad9]" /><h2 className="text-sm font-semibold">Command grammar</h2></div><p className="mt-2 text-[11px] leading-5 text-[#9296a1]">Use the same small vocabulary to inspect work, move it, or ask for context.</p><div className="mt-5 space-y-1.5">{commandExamples.map((example) => <button key={example} onClick={() => setCommand(example)} className="flex w-full items-center gap-2 rounded-lg bg-[#fafafa] px-2.5 py-2 text-left font-mono text-[10px] text-[#686c77] transition hover:bg-[#f1f0ff] hover:text-[#5e54c3]"><ChevronRight size={12} className="text-[#a6a8b1]" />{example}</button>)}</div></section><section className="rounded-2xl border border-[#dcd9ff] bg-[#f1f0ff] p-5"><div className="flex items-center gap-2 text-[#6e63d0]"><Bot size={15} /><p className="text-[10px] font-bold uppercase tracking-[0.12em]">Information desk</p></div><p className="mt-3 text-xs leading-5 text-[#68639a]">Ask ORO about a previous event, a colleague, or any active project spec.</p><button onClick={copyPrompt} className="mt-4 flex w-full items-center justify-between rounded-xl bg-white px-3 py-2.5 text-left font-mono text-[10px] text-[#5e54c3] shadow-sm"><span>ask ORO “what changed?”</span>{copied ? <Check size={13} /> : <Copy size={13} />}</button></section><section className="rounded-2xl border border-[#e1e3e8] bg-white p-5"><p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#a0a3ac]">Quick links</p><div className="mt-4 space-y-2">{projects.map((project) => <Link key={project.id} to={`/projects/${project.id}`} className="flex items-center justify-between rounded-lg px-2 py-2 text-[11px] font-semibold text-[#686c77] hover:bg-[#fafafa]"><span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: project.accent }} />{project.code}</span><ArrowUpRight size={13} className="text-[#a4a7b0]" /></Link>)}</div></section></aside></div><div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-2xl border border-[#e1e3e8] bg-white px-5 py-4 text-[10px] text-[#858994]"><span className="flex items-center gap-1.5"><Command size={13} /> Command history retained</span><span className="flex items-center gap-1.5"><UserRound size={13} /> KAI is your current tag</span><span className="flex items-center gap-1.5"><Bot size={13} /> Human and agent commands share the same grammar</span></div>
	</PortalShell>;
}
