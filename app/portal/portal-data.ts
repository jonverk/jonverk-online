export type EmployeeKind = "agent" | "human";
export type ProjectHealth = "on-track" | "at-risk" | "blocked";
export type TaskStatus = "backlog" | "in-progress" | "review" | "done";

export type Employee = {
	tag: string;
	name: string;
	role: string;
	kind: EmployeeKind;
	color: string;
	status: "online" | "focus" | "away";
	workload: number;
};

export type ProjectTask = {
	id: string;
	title: string;
	description: string;
	status: TaskStatus;
	assignee: string;
	priority: "low" | "medium" | "high";
	due: string;
	labels: string[];
};

export type ProjectMilestone = {
	label: string;
	date: string;
	status: "complete" | "current" | "upcoming" | "at-risk";
};

export type Project = {
	id: string;
	code: string;
	name: string;
	description: string;
	phase: string;
	phaseNumber: number;
	progress: number;
	health: ProjectHealth;
	accent: string;
	owner: string;
	updated: string;
	spec: string[];
	milestones: ProjectMilestone[];
	tasks: ProjectTask[];
};

export type ActivityItem = {
	id: string;
	tag: string;
	kind: EmployeeKind;
	action: string;
	target: string;
	time: string;
	color: string;
};

export type Communication = {
	id: string;
	channel: string;
	channelLabel: string;
	author: string;
	authorTag: string;
	kind: EmployeeKind;
	message: string;
	time: string;
	color: string;
};

export const employees: Employee[] = [
	{ tag: "KAI", name: "Kai Nord", role: "Operations lead", kind: "human", color: "#8c74ff", status: "online", workload: 72 },
	{ tag: "MIR", name: "Mira", role: "Research agent", kind: "agent", color: "#4fbd9b", status: "focus", workload: 88 },
	{ tag: "SOL", name: "Sol Reyes", role: "Product architect", kind: "human", color: "#ed8a64", status: "online", workload: 64 },
	{ tag: "NEX", name: "Nexus", role: "Delivery agent", kind: "agent", color: "#5d88e8", status: "online", workload: 53 },
	{ tag: "IVA", name: "Iva Chen", role: "People & culture", kind: "human", color: "#d68bc0", status: "away", workload: 41 },
	{ tag: "ORO", name: "Oro", role: "Information agent", kind: "agent", color: "#e1ad48", status: "focus", workload: 79 },
];

export const projects: Project[] = [
	{
		id: "atlas",
		code: "ATLAS-04",
		name: "Atlas migration",
		description: "Move the internal knowledge graph to the shared company memory layer.",
		phase: "Build & verify",
		phaseNumber: 3,
		progress: 68,
		health: "on-track",
		accent: "#7b6df2",
		owner: "MIR",
		updated: "12 min ago",
		spec: [
			"Every department can retrieve the same source of truth with a plain-language question.",
			"Existing project notes, decisions, and handoffs retain their original provenance.",
			"A new employee can find the current project state in under two minutes.",
		],
		milestones: [
			{ label: "Context map", date: "Aug 18", status: "complete" },
			{ label: "Ingestion pass", date: "Aug 26", status: "complete" },
			{ label: "Recall testing", date: "Sep 02", status: "current" },
			{ label: "Company rollout", date: "Sep 09", status: "upcoming" },
		],
		tasks: [
			{ id: "at-1", title: "Index the project decision log", description: "Create a stable index for decisions and their source documents.", status: "done", assignee: "ORO", priority: "high", due: "Aug 26", labels: ["memory", "infra"] },
			{ id: "at-2", title: "Test ambiguous staff questions", description: "Run the 24-question recall suite across human and agent phrasing.", status: "in-progress", assignee: "MIR", priority: "high", due: "Aug 30", labels: ["research"] },
			{ id: "at-3", title: "Write information desk handoff", description: "Document when to ask the information department instead of guessing.", status: "review", assignee: "IVA", priority: "medium", due: "Sep 01", labels: ["onboarding"] },
			{ id: "at-4", title: "Publish search usage guide", description: "Give every employee a short pattern library for better questions.", status: "backlog", assignee: "KAI", priority: "low", due: "Sep 04", labels: ["docs"] },
		],
	},
	{
		id: "relay",
		code: "RELAY-02",
		name: "Relay console",
		description: "A shared command surface for communication, work movement, and company memory.",
		phase: "Pilot",
		phaseNumber: 2,
		progress: 44,
		health: "at-risk",
		accent: "#ed8a64",
		owner: "NEX",
		updated: "34 min ago",
		spec: [
			"The same command vocabulary works for a human or an agent employee.",
			"Every write leaves a visible activity trail with the actor's three-letter tag.",
			"A command can be copied from the console and replayed by another employee.",
		],
		milestones: [
			{ label: "Command grammar", date: "Aug 22", status: "complete" },
			{ label: "Board sync", date: "Aug 29", status: "at-risk" },
			{ label: "Team pilot", date: "Sep 05", status: "current" },
			{ label: "Default surface", date: "Sep 13", status: "upcoming" },
		],
		tasks: [
			{ id: "re-1", title: "Define move and assign syntax", description: "Lock the smallest useful grammar for board actions.", status: "done", assignee: "NEX", priority: "high", due: "Aug 22", labels: ["cli"] },
			{ id: "re-2", title: "Persist command history", description: "Keep a replayable history for each employee tag.", status: "in-progress", assignee: "SOL", priority: "high", due: "Aug 29", labels: ["storage"] },
			{ id: "re-3", title: "Connect board events", description: "Reflect CLI moves and messages in the activity stream.", status: "in-progress", assignee: "NEX", priority: "high", due: "Aug 29", labels: ["sync"] },
			{ id: "re-4", title: "Invite information desk", description: "Give Oro a first-class ask flow in the pilot.", status: "backlog", assignee: "ORO", priority: "medium", due: "Sep 03", labels: ["ask"] },
		],
	},
	{
		id: "harbor",
		code: "HARBOR-07",
		name: "Harbor onboarding",
		description: "Make joining JonVerk legible for a person, an agent, or a mixed team.",
		phase: "Operationalize",
		phaseNumber: 4,
		progress: 82,
		health: "on-track",
		accent: "#4fbd9b",
		owner: "IVA",
		updated: "1 hr ago",
		spec: [
			"A new employee understands their role, current projects, and communication norms on day one.",
			"The three-letter identity tag is enough to address any colleague without suspicion.",
			"Handoffs make no distinction between human and agent employees.",
		],
		milestones: [
			{ label: "Welcome path", date: "Aug 19", status: "complete" },
			{ label: "Role playbook", date: "Aug 27", status: "complete" },
			{ label: "Mixed team test", date: "Sep 02", status: "current" },
			{ label: "Open enrollment", date: "Sep 06", status: "upcoming" },
		],
		tasks: [
			{ id: "ha-1", title: "Refresh first-week checklist", description: "Include identity, planning, and information desk rituals.", status: "done", assignee: "IVA", priority: "medium", due: "Aug 24", labels: ["people"] },
			{ id: "ha-2", title: "Pair agent and human buddies", description: "Set up reciprocal onboarding pairs for the pilot cohort.", status: "done", assignee: "KAI", priority: "medium", due: "Aug 28", labels: ["culture"] },
			{ id: "ha-3", title: "Review access language", description: "Ensure role-based access is explained without suspicion language.", status: "review", assignee: "SOL", priority: "high", due: "Sep 02", labels: ["policy"] },
		],
	},
];

export const activitySeed: ActivityItem[] = [
	{ id: "act-1", tag: "MIR", kind: "agent", action: "moved", target: "Test ambiguous staff questions → In progress", time: "4 min ago", color: "#4fbd9b" },
	{ id: "act-2", tag: "KAI", kind: "human", action: "commented in", target: "#relay / pilot room", time: "12 min ago", color: "#8c74ff" },
	{ id: "act-3", tag: "NEX", kind: "agent", action: "completed", target: "Define move and assign syntax", time: "21 min ago", color: "#5d88e8" },
	{ id: "act-4", tag: "IVA", kind: "human", action: "updated", target: "Harbor onboarding spec", time: "38 min ago", color: "#d68bc0" },
	{ id: "act-5", tag: "ORO", kind: "agent", action: "answered", target: "What changed in Atlas this week?", time: "52 min ago", color: "#e1ad48" },
	{ id: "act-6", tag: "SOL", kind: "human", action: "assigned", target: "Review access language → SOL", time: "1 hr ago", color: "#ed8a64" },
];

export const communicationSeed: Communication[] = [
	{ id: "com-1", channel: "relay", channelLabel: "Relay console pilot", author: "Kai Nord", authorTag: "KAI", kind: "human", message: "The board should feel like a shared surface, not a report. If an agent moves a card, the room sees it immediately.", time: "09:42", color: "#8c74ff" },
	{ id: "com-2", channel: "relay", channelLabel: "Relay console pilot", author: "Nexus", authorTag: "NEX", kind: "agent", message: "Confirmed. I can emit the same activity event from a CLI move and a board drag.", time: "09:45", color: "#5d88e8" },
	{ id: "com-3", channel: "information", channelLabel: "Information desk", author: "Oro", authorTag: "ORO", kind: "agent", message: "Atlas recall testing has 19 of 24 answers passing. The remaining five are all provenance questions.", time: "10:06", color: "#e1ad48" },
	{ id: "com-4", channel: "general", channelLabel: "Company floor", author: "Iva Chen", authorTag: "IVA", kind: "human", message: "Harbor mixed-team test starts Friday. Add your onboarding notes to the project log before then.", time: "10:19", color: "#d68bc0" },
];

export const commandHistorySeed = [
	{ command: "status --today", output: "3 projects active · 2 on track · 1 needs attention" },
	{ command: "ask ORO \"what changed in Atlas?\"", output: "MIR moved recall testing to In progress · 19/24 checks passing" },
];

export const getEmployee = (tag: string) => employees.find((employee) => employee.tag === tag) ?? employees[0];
export const getProject = (id: string) => projects.find((project) => project.id === id) ?? projects[0];
