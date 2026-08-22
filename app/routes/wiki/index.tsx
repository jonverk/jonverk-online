import { useState, useEffect } from "react";
import { Link } from "react-router";
import { BookOpen, FileText, Code2 } from "lucide-react";

type WikiPage = {
	id: string;
	title: string;
	type: string;
	created_at: string;
	updated_at: string;
};

export default function WikiIndex() {
	const [pages, setPages] = useState<WikiPage[]>([]);

	useEffect(() => {
		fetch("/api/wiki")
			.then((res) => res.json())
			.then((data: any) => {
				if (data.success) {
					setPages(data.result);
				}
			});
	}, []);

	return (
		<main className="min-h-screen bg-[#f7f7f5] text-[#171717] flex">
			{/* Sidebar */}
			<div className="w-64 border-r border-black/10 bg-white/50 p-4 flex flex-col h-screen">
				<Link to="/" className="flex items-center gap-2 mb-8 text-black/60 hover:text-black">
					<span className="grid h-6 w-6 place-items-center rounded bg-[#171717] text-white text-xs">J</span>
					<span className="font-semibold text-sm">Headquarters</span>
				</Link>

				<div className="flex items-center justify-between mb-4">
					<h2 className="text-xs font-semibold uppercase tracking-wider text-black/40">Wiki</h2>
				</div>

				<div className="flex flex-col gap-1">
					<Link to="/wiki" className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm bg-black/5 font-medium">
						<BookOpen size={16} className="text-black/60" />
						Overview
					</Link>
					{pages.map((page) => (
						<Link
							key={page.id}
							to={`/wiki/${page.id}`}
							className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-black/60 hover:text-black hover:bg-black/5 transition"
						>
							{page.type === "code" ? <Code2 size={16} /> : <FileText size={16} />}
							{page.title}
						</Link>
					))}
				</div>
			</div>

			{/* Main Content */}
			<div className="flex-1 overflow-y-auto p-12">
				<div className="max-w-3xl mx-auto">
					<div className="flex items-center gap-3 mb-8">
						<BookOpen size={32} className="text-purple-600" />
						<h1 className="text-3xl font-bold">LLM & Code Wiki</h1>
					</div>

					<div className="prose prose-stone max-w-none">
						<p className="text-lg text-black/60">
							Welcome to the central knowledge base. This wiki serves as the permanent, compounding memory for all projects and agents.
						</p>

						<div className="grid gap-6 sm:grid-cols-2 mt-12">
							<div className="rounded-xl border border-black/10 bg-white p-6 shadow-sm">
								<h3 className="font-semibold text-lg flex items-center gap-2 mb-2">
									<FileText size={20} className="text-blue-500" />
									LLM Wiki (Layer 2)
								</h3>
								<p className="text-sm text-black/60 mb-4">
									Agent-owned markdown files holding entity pages, concepts, and comparisons based on Andrej Karpathy's pattern.
								</p>
								<div className="text-xs font-medium text-black/40 uppercase tracking-wider">Indexed Topics</div>
								<ul className="mt-2 space-y-1 text-sm text-black/60">
									<li>• AI Models & Architecture</li>
									<li>• Agent Orchestration</li>
									<li>• Cloudflare Ecosystem</li>
								</ul>
							</div>

							<div className="rounded-xl border border-black/10 bg-white p-6 shadow-sm">
								<h3 className="font-semibold text-lg flex items-center gap-2 mb-2">
									<Code2 size={20} className="text-green-500" />
									Code Wiki
								</h3>
								<p className="text-sm text-black/60 mb-4">
									Auto-generated reference documentation for codebases, including Mermaid architecture and sequence diagrams.
								</p>
								<div className="text-xs font-medium text-black/40 uppercase tracking-wider">Available Repos</div>
								<ul className="mt-2 space-y-1 text-sm text-black/60">
									<li>• jonverk-online</li>
									<li>• crechur-relay-core</li>
								</ul>
							</div>
						</div>
					</div>
				</div>
			</div>
		</main>
	);
}
