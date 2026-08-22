import { useEffect, useRef } from "react";
import mermaid from "mermaid";
import type { Route } from "./+types/home";
import { Link } from "react-router";
import { MessageSquare, ListTodo, BookOpen } from "lucide-react";

export function meta(_: Route.MetaArgs) {
	return [
		{ title: "Cloud Headquarters" },
		{ name: "description", content: "The centralized hub for our organization." },
	];
}

const ORG_CHART = `
graph TD
    HUMAN["The Guide<br/>Subtle unfocused leadership"]
    HEAD["Head of Operations<br/>Highest-ranking unit"]
    VISION["Visionary Lead<br/>Reports to Head Unit"]
    COUNCIL["Advisory Council<br/>External expert role"]
    EXEC["Executive Director<br/>Next in line"]
    CHIEF["Chief Engineer<br/>Coding and engineering assignments"]
    JUNIOR["Engineers<br/>Assigned implementation work"]
    ARCH["Archivists<br/>Wiki and verification layer"]

    HUMAN -->|"outranks"| HEAD
    HEAD -->|"directs; receives reports from"| VISION
    HEAD -->|"next in line"| EXEC
    HEAD -->|"coordinates the wiki and verification layer"| ARCH
    EXEC -->|"coordinates technical execution"| CHIEF
    CHIEF -->|"assigns engineering work"| JUNIOR
    VISION -.->|"can convene"| COUNCIL

    %% Adding click events
    click HUMAN "/wiki/the-guide" "View details"
    click HEAD "/wiki/head-of-operations" "View details"
    click VISION "/wiki/visionary-lead" "View details"
    click COUNCIL "/wiki/advisory-council" "View details"
    click EXEC "/wiki/executive-director" "View details"
    click CHIEF "/wiki/chief-engineer" "View details"
    click JUNIOR "/wiki/engineers" "View details"
    click ARCH "/wiki/archivists" "View details"

    %% Styling
    classDef default fill:#fff,stroke:#e5e7eb,stroke-width:2px,color:#111827,rx:8px,ry:8px;
    classDef subtle fill:#f9fafb,stroke:#f3f4f6,stroke-dasharray: 5 5,color:#6b7280;
    class HUMAN subtle;
`;

export default function Home(_: Route.ComponentProps) {
	const chartRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		mermaid.initialize({
			startOnLoad: true,
			theme: "base",
			securityLevel: "loose",
			themeVariables: {
				primaryColor: "#ffffff",
				primaryBorderColor: "#e5e7eb",
				primaryTextColor: "#111827",
				lineColor: "#9ca3af",
				fontFamily: "inherit",
			},
		});

		if (chartRef.current) {
			mermaid.render("org-chart", ORG_CHART).then((result) => {
				if (chartRef.current) {
					chartRef.current.innerHTML = result.svg;
				}
			});
		}
	}, []);

	return (
		<main className="min-h-screen bg-[#f7f7f5] text-[#171717]">
			<div className="mx-auto flex w-full max-w-7xl flex-col px-6 py-12 sm:px-10 lg:px-16">
				<header className="mb-16 text-center">
					<h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Cloud Headquarters</h1>
					<p className="mt-4 text-lg text-black/60">jonverk.online organization base</p>
				</header>

				<div className="grid gap-8 lg:grid-cols-3">
					<div className="lg:col-span-2 rounded-2xl border border-black/10 bg-white p-8 shadow-sm">
						<h2 className="mb-6 text-xl font-semibold">Organization Structure</h2>
						<div
							ref={chartRef}
							className="mermaid-container flex justify-center overflow-x-auto"
						/>
					</div>

					<div className="flex flex-col gap-4">
						<Link
							to="/channels"
							className="group flex flex-col gap-2 rounded-2xl border border-black/10 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-black/20 hover:shadow-md"
						>
							<div className="flex items-center gap-3">
								<div className="rounded-lg bg-blue-50 p-2 text-blue-600">
									<MessageSquare size={24} />
								</div>
								<h3 className="font-semibold">Communications</h3>
							</div>
							<p className="text-sm text-black/60">
								Real-time chat and multi-channel text flow for agent handoffs.
							</p>
						</Link>

						<Link
							to="/tasks"
							className="group flex flex-col gap-2 rounded-2xl border border-black/10 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-black/20 hover:shadow-md"
						>
							<div className="flex items-center gap-3">
								<div className="rounded-lg bg-green-50 p-2 text-green-600">
									<ListTodo size={24} />
								</div>
								<h3 className="font-semibold">Task Board</h3>
							</div>
							<p className="text-sm text-black/60">
								Global member delegation and project tracking.
							</p>
						</Link>

						<Link
							to="/wiki"
							className="group flex flex-col gap-2 rounded-2xl border border-black/10 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-black/20 hover:shadow-md"
						>
							<div className="flex items-center gap-3">
								<div className="rounded-lg bg-purple-50 p-2 text-purple-600">
									<BookOpen size={24} />
								</div>
								<h3 className="font-semibold">Wiki System</h3>
							</div>
							<p className="text-sm text-black/60">
								LLM Wiki and Code Wiki database for ongoing projects.
							</p>
						</Link>
					</div>
				</div>
			</div>
		</main>
	);
}
