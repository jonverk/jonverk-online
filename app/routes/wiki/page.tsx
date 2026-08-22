import { useState, useEffect } from "react";
import { Link, useParams } from "react-router";
import { BookOpen, FileText, Code2 } from "lucide-react";

type WikiPage = {
	id: string;
	title: string;
	type: string;
	content: string;
	created_at: string;
	updated_at: string;
};

export default function WikiPageViewer() {
	const params = useParams();
	const [page, setPage] = useState<WikiPage | null>(null);
	const [allPages, setAllPages] = useState<{ id: string; title: string; type: string }[]>([]);

	useEffect(() => {
		fetch("/api/wiki")
			.then((res) => res.json())
			.then((data: any) => {
				if (data.success) {
					setAllPages(data.result);
				}
			});
	}, []);

	useEffect(() => {
		fetch(`/api/wiki/${params.id}`)
			.then((res) => res.json())
			.then((data: any) => {
				if (data.success && data.result) {
					setPage(data.result);
				}
			});
	}, [params.id]);

	return (
		<main className="min-h-screen bg-[#f7f7f5] text-[#171717] flex">
			{/* Sidebar */}
			<div className="w-64 border-r border-black/10 bg-white/50 p-4 flex flex-col h-screen hidden md:flex">
				<Link to="/" className="flex items-center gap-2 mb-8 text-black/60 hover:text-black">
					<span className="grid h-6 w-6 place-items-center rounded bg-[#171717] text-white text-xs">J</span>
					<span className="font-semibold text-sm">Headquarters</span>
				</Link>

				<div className="flex items-center justify-between mb-4">
					<h2 className="text-xs font-semibold uppercase tracking-wider text-black/40">Wiki</h2>
				</div>

				<div className="flex flex-col gap-1 overflow-y-auto">
					<Link to="/wiki" className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-black/60 hover:text-black hover:bg-black/5 transition">
						<BookOpen size={16} />
						Overview
					</Link>
					{allPages.map((p) => (
						<Link
							key={p.id}
							to={`/wiki/${p.id}`}
							className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition ${p.id === params.id ? "bg-black/5 font-medium" : "text-black/60 hover:text-black hover:bg-black/5"}`}
						>
							{p.type === "code" ? <Code2 size={16} /> : <FileText size={16} />}
							{p.title}
						</Link>
					))}
				</div>
			</div>

			{/* Main Content */}
			<div className="flex-1 overflow-y-auto bg-white">
				{page ? (
					<div className="max-w-3xl mx-auto p-12">
						<header className="mb-10 pb-6 border-b border-black/10">
							<div className="flex items-center gap-2 text-sm text-black/40 mb-3 uppercase tracking-wider font-semibold">
								{page.type === "code" ? "Code Wiki" : "LLM Wiki"}
								<span>•</span>
								Last updated {new Date(page.updated_at).toLocaleDateString()}
							</div>
							<h1 className="text-4xl font-bold tracking-tight">{page.title}</h1>
						</header>

						<div className="prose prose-stone max-w-none font-sans">
							{/* Simple markdown-like rendering for demo */}
							{page.content.split('\n\n').map((paragraph, i) => {
								if (paragraph.startsWith('# ')) {
									return <h1 key={i} className="text-3xl font-bold mt-8 mb-4">{paragraph.slice(2)}</h1>;
								}
								if (paragraph.startsWith('## ')) {
									return <h2 key={i} className="text-2xl font-semibold mt-8 mb-4">{paragraph.slice(3)}</h2>;
								}
								if (paragraph.startsWith('```')) {
									return (
										<pre key={i} className="bg-[#171717] text-white p-4 rounded-xl overflow-x-auto my-6 text-sm font-mono">
											<code>{paragraph.split('\n').slice(1, -1).join('\n')}</code>
										</pre>
									);
								}
								return <p key={i} className="mb-4 leading-7 text-black/80">{paragraph}</p>;
							})}
						</div>
					</div>
				) : (
					<div className="h-full flex items-center justify-center">
						<p className="text-black/40">Loading page...</p>
					</div>
				)}
			</div>
		</main>
	);
}
