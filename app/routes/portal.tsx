import { ArrowRight, Bot, CalendarDays, Check, CircleAlert, Clock3, Filter, Gauge, MessageSquare, Plus, Sparkles, TrendingUp, Users } from "lucide-react";
import { Link } from "react-router";

import type { Route } from "./+types/portal";
import { HealthPill, PageHeading, PortalShell, TagBadge } from "../portal/PortalShell";
import { activitySeed, employees, projects } from "../portal/portal-data";

export function meta(_: Route.MetaArgs) {
	return [
		{ title: "Planning · Jonverk Portal" },
		{ name: "description", content: "Shared planning and workload view for JonVerk." },
	];
}

const milestones = [
	{ date: "Aug 26", label: "Atlas recall test", project: "ATLAS-04", status: "current", color: "#7b6df2" },
	{ date: "Aug 29", label: "Relay board sync", project: "RELAY-02", status: "at-risk", color: "#ed8a64" },
	{ date: "Sep 02", label: "Mixed team test", project: "HARBOR-07", status: "upcoming", color: "#4fbd9b" },
	{ date: "Sep 05", label: "Relay team pilot", project: "RELAY-02", status: "upcoming", color: "#ed8a64" },
];

export default function Portal() {
	return <PortalShell>
		<PageHeading eyebrow="Company planning" title="Good morning, Kai." description="The whole company in one view. Plans, conversations, and hard-won context stay addressable for every employee." action={<div className="flex flex-wrap gap-2"><Link to="/cli" className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#202126] px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-black"><span className="font-mono text-[11px] text-[#bdb7ff]">$</span> Open CLI</Link><Link to="/projects" className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#e0e2e7] bg-white px-4 text-xs font-semibold text-[#50545f] transition hover:bg-[#f7f7f8]"><Plus size={15} /> New project</Link></div>} />

		<div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
			{[
				{ label: "Active projects", value: "03", meta: "2 on track · 1 needs attention", icon: FolderIcon, tone: "text-[#756ad9] bg-[#eeecff]" },
				{ label: "Open tasks", value: "11", meta: "4 due this week", icon: Check, tone: "text-[#3c9c7f] bg-[#e6f7f0]" },
				{ label: "Team workload", value: "67%", meta: "+8% from last Monday", icon: Gauge, tone: "text-[#d37c5c] bg-[#fff0ea]" },
				{ label: "Live colleagues", value: "06", meta: "3 humans · 3 agents", icon: Users, tone: "text-[#5680c9] bg-[#eaf1ff]" },
			].map(({ label, value, meta, icon: Icon, tone }) => <div key={label} className="rounded-2xl border border-[#e1e3e8] bg-white p-5"><div className="flex items-start justify-between"><p className="text-[11px] font-semibold text-[#858994]">{label}</p><span className={`grid h-8 w-8 place-items-center rounded-lg ${tone}`}><Icon size={16} /></span></div><div className="mt-4 flex items-baseline gap-2"><p className="text-[27px] font-semibold tracking-[-0.05em]">{value}</p><p className="text-[10px] text-[#9a9da6]">{meta}</p></div></div>)}
		</div>

		<div className="mt-5 grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
			<section className="rounded-2xl border border-[#e1e3e8] bg-white p-5 sm:p-6">
				<div className="flex items-start justify-between"><div><div className="flex items-center gap-2"><CalendarDays size={16} className="text-[#776cd8]" /><h2 className="text-sm font-semibold">Milestone timeline</h2></div><p className="mt-1 text-[11px] text-[#9296a1]">What is moving through the company next.</p></div><button className="flex items-center gap-1.5 rounded-lg border border-[#e7e8ec] px-2.5 py-1.5 text-[10px] font-semibold text-[#797d88] hover:bg-[#fafafa]"><Filter size={12} /> This month</button></div>
				<div className="relative mt-8 pb-1"><div className="absolute left-[57px] top-2 bottom-2 w-px bg-[#e4e5e9] sm:left-[74px]" />{milestones.map((milestone) => <div key={milestone.label} className="relative flex gap-4 pb-6 last:pb-0 sm:gap-6"><div className="w-[42px] shrink-0 pt-0.5 text-right text-[10px] font-semibold text-[#9b9ea8] sm:w-[58px]">{milestone.date}</div><div className="relative z-10 mt-0.5 grid h-[9px] w-[9px] shrink-0 place-items-center rounded-full border-2 border-white shadow-[0_0_0_1px_#dfe1e6]" style={{ backgroundColor: milestone.color }} /> <div className="-mt-1 flex min-w-0 flex-1 items-start justify-between gap-3"><div><p className="text-xs font-semibold text-[#383a42]">{milestone.label}</p><p className="mt-1 text-[10px] text-[#9699a3]">{milestone.project}</p></div><span className={`shrink-0 rounded-md px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.08em] ${milestone.status === "at-risk" ? "bg-[#fff0ea] text-[#c6654a]" : milestone.status === "current" ? "bg-[#eeecff] text-[#6d61ce]" : "bg-[#f1f2f4] text-[#91949e]"}`}>{milestone.status === "at-risk" ? "At risk" : milestone.status}</span></div></div>)}</div>
				<div className="mt-7 flex items-center justify-between border-t border-[#eff0f2] pt-4"><p className="flex items-center gap-1.5 text-[10px] text-[#9498a2]"><CircleAlert size={13} className="text-[#e28a68]" /> Relay board sync needs a decision this week</p><Link to="/projects/relay" className="flex items-center gap-1 text-[10px] font-semibold text-[#6e64ce]">View project <ArrowRight size={12} /></Link></div>
			</section>

			<section className="rounded-2xl border border-[#e1e3e8] bg-white p-5 sm:p-6"><div className="flex items-start justify-between"><div><div className="flex items-center gap-2"><TrendingUp size={16} className="text-[#776cd8]" /><h2 className="text-sm font-semibold">Status matrix</h2></div><p className="mt-1 text-[11px] text-[#9296a1]">A deterministic read on active work.</p></div><span className="rounded-md bg-[#f4f4f6] px-2 py-1 text-[9px] font-bold uppercase tracking-[0.08em] text-[#9296a1]">This week</span></div><div className="mt-6 overflow-hidden rounded-xl border border-[#ececef]"><div className="grid grid-cols-[1.3fr_0.7fr_0.7fr] bg-[#fafafa] px-3 py-2.5 text-[9px] font-bold uppercase tracking-[0.1em] text-[#a0a3ac]"><span>Project</span><span>Phase</span><span>Health</span></div>{projects.map((project) => <Link to={`/projects/${project.id}`} key={project.id} className="grid grid-cols-[1.3fr_0.7fr_0.7fr] items-center border-t border-[#f0f0f2] px-3 py-3 transition hover:bg-[#fafaff]"><span className="flex min-w-0 items-center gap-2"><span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: project.accent }} /><span className="truncate text-[11px] font-semibold text-[#4a4c55]">{project.code}</span></span><span className="text-[10px] text-[#858994]">{project.phase}</span><HealthPill health={project.health} /></Link>)}</div><div className="mt-5 flex items-center gap-2 text-[10px] text-[#9296a1]"><span className="h-2 w-2 rounded-full bg-[#4fbd9b]" /> On track <span className="ml-2 h-2 w-2 rounded-full bg-[#ed8a64]" /> Needs attention</div></section>
		</div>

		<div className="mt-5 grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
			<section className="rounded-2xl border border-[#e1e3e8] bg-white p-5 sm:p-6"><div className="flex items-start justify-between"><div><div className="flex items-center gap-2"><Users size={16} className="text-[#776cd8]" /><h2 className="text-sm font-semibold">Team workload</h2></div><p className="mt-1 text-[11px] text-[#9296a1]">Capacity is visible, not assumed.</p></div><Link to="/activity" className="text-[10px] font-semibold text-[#6e64ce]">View activity</Link></div><div className="mt-6 space-y-4">{employees.slice(0, 5).map((employee) => <div key={employee.tag} className="flex items-center gap-3"><TagBadge tag={employee.tag} kind={employee.kind} color={employee.color} /><div className="min-w-0 flex-1"><div className="mb-1.5 flex items-center justify-between gap-3"><span className="truncate text-[10px] text-[#777b86]">{employee.role}</span><span className="text-[10px] font-semibold text-[#5b5e68]">{employee.workload}%</span></div><div className="h-1.5 overflow-hidden rounded-full bg-[#f0f1f3]"><div className="h-full rounded-full" style={{ width: `${employee.workload}%`, backgroundColor: employee.color }} /></div></div></div>)}</div></section>
			<section className="rounded-2xl border border-[#e1e3e8] bg-white p-5 sm:p-6"><div className="flex items-start justify-between"><div><div className="flex items-center gap-2"><ActivityIcon /><h2 className="text-sm font-semibold">Live activity</h2></div><p className="mt-1 text-[11px] text-[#9296a1]">One shared stream for human and agent work.</p></div><Link to="/activity" className="text-[10px] font-semibold text-[#6e64ce]">See all</Link></div><div className="mt-5 divide-y divide-[#f0f0f2]">{activitySeed.slice(0, 4).map((item) => <div key={item.id} className="flex items-center gap-3 py-3 first:pt-0"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-[8px] font-bold text-white" style={{ backgroundColor: item.color }}>{item.tag}</span><p className="min-w-0 flex-1 text-[11px] leading-5 text-[#666a75]"><strong className="font-semibold text-[#34363e]">{item.tag}</strong> {item.action} <span className="font-medium text-[#4f52a0]">{item.target}</span></p><span className="shrink-0 text-[9px] text-[#a2a5ae]">{item.time}</span></div>)}</div></section>
		</div>

		<div className="mt-5 flex flex-col gap-4 rounded-2xl border border-[#dcd9ff] bg-[#f1f0ff] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"><div className="flex items-start gap-3"><span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white text-[#7166d4] shadow-sm"><Sparkles size={15} /></span><div><p className="text-xs font-semibold text-[#403a86]">Ask the information desk</p><p className="mt-1 text-[11px] leading-5 text-[#706ca4]">Need context from a previous event or active spec? Ask Oro in the CLI and keep moving.</p></div></div><Link to="/cli" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#6e63d0] px-4 py-2.5 text-[11px] font-semibold text-white transition hover:bg-[#5e54bd]">Ask Oro <ArrowRight size={13} /></Link></div>
	</PortalShell>;
}

function FolderIcon({ size }: { size?: number }) { return <span className="text-[17px]">◫</span>; }
function ActivityIcon() { return <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#eeecff] text-[#7166d4]"><Clock3 size={15} /></span>; }
