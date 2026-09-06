import {
	Activity,
	ArrowUpRight,
	BookOpen,
	Bot,
	ChevronDown,
	CircleHelp,
	Command,
	FolderKanban,
	LayoutDashboard,
	Menu,
	MessageSquare,
	Radio,
	Search,
	Settings2,
	ShieldCheck,
	Terminal,
	Users,
	X,
} from "lucide-react";
import { useState } from "react";
import { NavLink, Link, useLocation } from "react-router";

import { getEmployee } from "./portal-data";

const navItems = [
	{ label: "Planning", to: "/portal", icon: LayoutDashboard, end: true },
	{ label: "Projects", to: "/projects", icon: FolderKanban },
	{ label: "Communications", to: "/communications", icon: MessageSquare },
	{ label: "Activity log", to: "/activity", icon: Activity },
];

export function PortalShell({ children }: { children: React.ReactNode }) {
	const [mobileOpen, setMobileOpen] = useState(false);
	const location = useLocation();
	const currentUser = getEmployee("KAI");

	return (
		<div className="min-h-screen bg-[#f4f5f7] text-[#202126]">
			<div className="flex min-h-screen">
				<aside className={`${mobileOpen ? "translate-x-0" : "-translate-x-full"} fixed inset-y-0 left-0 z-40 flex w-[252px] flex-col border-r border-[#e1e3e8] bg-[#fbfbfc] px-4 py-5 transition-transform duration-200 lg:static lg:translate-x-0`}>
					<div className="flex items-center justify-between px-3">
						<Link to="/portal" className="flex items-center gap-2.5" onClick={() => setMobileOpen(false)}>
							<span className="grid h-8 w-8 place-items-center rounded-[10px] bg-[#202126] text-sm font-bold text-white">J</span>
							<span className="text-[15px] font-semibold tracking-[-0.03em]">jonverk<span className="text-[#989ca8]">.online</span></span>
						</Link>
						<button className="grid h-8 w-8 place-items-center rounded-lg text-[#8c909b] hover:bg-[#f0f1f4] lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Close navigation"><X size={17} /></button>
					</div>

					<div className="mt-9 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#a1a4ad]">Workspace</div>
					<nav className="mt-2 space-y-1" aria-label="Workspace navigation">
						{navItems.map(({ label, to, icon: Icon, end }) => (
							<NavLink key={to} to={to} end={end} onClick={() => setMobileOpen(false)} className={({ isActive }) => `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition ${isActive ? "bg-[#ecebff] text-[#5d51c8]" : "text-[#696d78] hover:bg-[#f0f1f4] hover:text-[#30323a]"}`}>
								<Icon size={17} strokeWidth={1.8} />
								<span>{label}</span>
								{label === "Communications" && <span className="ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-[#dfe9ff] px-1.5 text-[10px] font-bold text-[#5579c2]">4</span>}
							</NavLink>
						))}
					</nav>

					<div className="mt-8 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#a1a4ad]">Control surface</div>
					<nav className="mt-2 space-y-1" aria-label="Control navigation">
						<NavLink to="/cli" onClick={() => setMobileOpen(false)} className={({ isActive }) => `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition ${isActive ? "bg-[#202126] text-white" : "text-[#696d78] hover:bg-[#f0f1f4] hover:text-[#30323a]"}`}><Terminal size={17} strokeWidth={1.8} /><span>CLI console</span><span className="ml-auto rounded bg-white/10 px-1.5 py-0.5 font-mono text-[9px]">⌘ K</span></NavLink>
						<Link to="/room/company-floor" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium text-[#696d78] transition hover:bg-[#f0f1f4] hover:text-[#30323a]"><Radio size={17} strokeWidth={1.8} /><span>Open room chat</span><ArrowUpRight className="ml-auto text-[#a1a4ad]" size={14} /></Link>
					</nav>

					<div className="mt-auto space-y-1 pt-8">
						<button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium text-[#696d78] hover:bg-[#f0f1f4]"><BookOpen size={17} strokeWidth={1.8} /><span>Information desk</span><CircleHelp className="ml-auto text-[#a1a4ad]" size={15} /></button>
						<button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium text-[#696d78] hover:bg-[#f0f1f4]"><Settings2 size={17} strokeWidth={1.8} /><span>Workspace settings</span></button>
						<div className="mt-3 border-t border-[#e5e6ea] pt-3">
							<div className="flex items-center gap-2.5 rounded-xl px-3 py-2">
								<span className="grid h-8 w-8 place-items-center rounded-full text-[10px] font-bold text-white" style={{ backgroundColor: currentUser.color }}>{currentUser.tag}</span>
								<div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold">{currentUser.name}</p><p className="truncate text-[10px] text-[#9296a1]">{currentUser.role}</p></div>
								<ChevronDown size={14} className="text-[#a1a4ad]" />
							</div>
						</div>
					</div>
				</aside>

				{mobileOpen && <button className="fixed inset-0 z-30 bg-black/20 lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Close navigation overlay" />}

				<div className="min-w-0 flex-1">
					<header className="sticky top-0 z-20 flex h-[68px] items-center justify-between border-b border-[#e1e3e8] bg-[#f8f9fa]/90 px-5 backdrop-blur sm:px-8 lg:px-10">
						<div className="flex items-center gap-3">
							<button className="grid h-9 w-9 place-items-center rounded-xl border border-[#e1e3e8] bg-white text-[#6d717c] lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open navigation"><Menu size={18} /></button>
							<div className="hidden items-center gap-2 text-xs text-[#969aa4] sm:flex"><ShieldCheck size={14} className="text-[#4fbd9b]" /> Zero-suspicion workspace <span className="text-[#c6c8cd]">/</span> Everyone is addressable</div>
							<div className="flex items-center gap-2 text-xs text-[#858994] sm:hidden"><ShieldCheck size={14} className="text-[#4fbd9b]" /> JonVerk portal</div>
						</div>
						<div className="flex items-center gap-2 sm:gap-4">
							<label className="hidden h-9 items-center gap-2 rounded-xl border border-[#e1e3e8] bg-white px-3 text-xs text-[#9ca0aa] md:flex" htmlFor="portal-search"><Search size={14} /><input id="portal-search" className="w-36 bg-transparent outline-none placeholder:text-[#a4a7b0]" placeholder="Search workspace" /></label>
							<div className="flex items-center gap-1.5 text-[11px] font-medium text-[#777b87]"><span className="h-2 w-2 animate-pulse rounded-full bg-[#4fbd9b]" /> Live</div>
							<button className="grid h-9 w-9 place-items-center rounded-xl border border-[#e1e3e8] bg-white text-[#777b87] hover:text-[#202126]" aria-label="Open command palette"><Command size={16} /></button>
						</div>
					</header>
					<main className="mx-auto w-full max-w-[1480px] px-5 py-7 sm:px-8 lg:px-10 lg:py-9">{children}</main>
				</div>
			</div>
		</div>
	);
}

export function PageHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) {
	return <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#7a70d7]">{eyebrow}</p><h1 className="mt-2 text-[30px] font-semibold tracking-[-0.045em] text-[#24252b] sm:text-[36px]">{title}</h1><p className="mt-2 max-w-2xl text-[13px] leading-6 text-[#7e828d]">{description}</p></div>{action}</div>;
}

export function TagBadge({ tag, kind, color, small = false }: { tag: string; kind?: "agent" | "human"; color: string; small?: boolean }) {
	return <span className={`inline-flex items-center gap-1.5 ${small ? "text-[10px]" : "text-[11px]"} font-semibold text-[#60646f]`}><span className={`${small ? "h-5 w-5 text-[7px]" : "h-6 w-6 text-[8px]"} grid place-items-center rounded-full font-bold text-white`} style={{ backgroundColor: color }}>{tag}</span>{kind && <span className="rounded-md border border-[#e6e7eb] bg-[#fafafa] px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-[0.08em] text-[#9296a1]">{kind}</span>}</span>;
}

export function HealthPill({ health }: { health: "on-track" | "at-risk" | "blocked" }) {
	const config = { "on-track": ["On track", "bg-[#e8f7f1] text-[#32866d]"], "at-risk": ["At risk", "bg-[#fff0ea] text-[#c6654a]"], blocked: ["Blocked", "bg-[#fee8e8] text-[#bd5757]"] } as const;
	const [label, styles] = config[health];
	return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold ${styles}`}><span className="h-1.5 w-1.5 rounded-full bg-current" />{label}</span>;
}

export function EmptyState({ icon: Icon = Users, title, description }: { icon?: typeof Users; title: string; description: string }) {
	return <div className="grid place-items-center rounded-2xl border border-dashed border-[#d9dbe1] bg-white py-14 text-center"><span className="grid h-11 w-11 place-items-center rounded-xl bg-[#f0efff] text-[#7469da]"><Icon size={19} /></span><h3 className="mt-4 text-sm font-semibold">{title}</h3><p className="mt-1 max-w-xs text-xs leading-5 text-[#858994]">{description}</p></div>;
}
