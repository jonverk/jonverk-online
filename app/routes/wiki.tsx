import { useMemo, useState } from "react";
import { Link } from "react-router";

import { marked } from "marked";

import type { Route } from "./+types/wiki";

export type WikiPage = {
	id: string;
	title: string;
	type: string;
	content: string;
};

export type WikiLoaderData = {
	pages: WikiPage[];
	error?: string;
};

type WikiRow = {
	id: string;
	title: string;
	type: string;
	content: string;
};

export async function loader({ context }: Route.LoaderArgs): Promise<WikiLoaderData> {
	const env = (context as { cloudflare?: { env?: Env } }).cloudflare?.env;

	if (!env?.DB) {
		return { pages: [], error: "The wiki database is not configured." };
	}

	try {
		const { results } = await env.DB.prepare(
			"SELECT id, title, type, content FROM wiki_pages ORDER BY type, title",
		).all<WikiRow>();
		const pages = results.map((row) => ({
			id: row.id,
			title: row.title,
			type: row.type,
			content: row.content,
		}));
		return { pages };
	} catch (cause) {
		console.error("wiki loader failed", cause);
		return { pages: [], error: "The wiki could not be loaded right now. Please try again shortly." };
	}
}

export function meta({ data, params }: Route.MetaArgs) {
	const page = data?.pages.find((candidate) => candidate.id === params.pageId);
	const title = page ? `${page.title} · Wiki · Jonverk Online` : "Wiki · Jonverk Online";
	return [
		{ title },
		{ name: "description", content: "A public markdown wiki for the Jonverk Online project." },
	];
}

function typeLabel(type: string) {
	if (!type) return "General";
	return type.charAt(0).toUpperCase() + type.slice(1);
}

export default function Wiki({ loaderData, params }: Route.ComponentProps) {
	const pages = loaderData?.pages ?? [];
	const error = loaderData?.error;
	const [query, setQuery] = useState("");

	const trimmed = query.trim().toLowerCase();

	const filtered = useMemo(() => {
		if (!trimmed) return pages;
		return pages.filter(
			(page) =>
				page.title.toLowerCase().includes(trimmed) ||
				page.type.toLowerCase().includes(trimmed) ||
				page.content.toLowerCase().includes(trimmed),
		);
	}, [pages, trimmed]);

	const groups = useMemo(() => {
		const byType = new Map<string, WikiPage[]>();
		for (const page of filtered) {
			const list = byType.get(page.type) ?? [];
			list.push(page);
			byType.set(page.type, list);
		}
		return [...byType.entries()];
	}, [filtered]);

	const pageExists = params.pageId != null && pages.some((page) => page.id === params.pageId);
	const activePage = pages.find((page) => page.id === params.pageId) ?? pages[0] ?? null;
	const activeHtml = activePage
		? marked.parse(activePage.content, { gfm: true, breaks: true, async: false })
		: "";

	return (
		<main className="min-h-screen bg-[#f7f7f5] text-[#171717]">
			<div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col border border-dashed px-6 py-8 sm:px-10">
				<header className="flex flex-wrap items-center justify-between gap-3">
					<div className="flex items-center gap-3 text-sm font-semibold tracking-tight">
						<Link to="/" className="grid h-9 w-9 place-items-center rounded-xl bg-[#171717] text-white shadow-sm" aria-label="Back to jonverk.online home">J</Link>
						<span>jonverk.online <span className="text-black/35">/</span> wiki</span>
					</div>
					<span className="rounded-full border border-black/10 bg-white/60 px-3 py-1.5 text-xs text-black/60">Public knowledge base</span>
				</header>

				<div className="mt-8 flex min-h-[calc(100vh-10rem)] flex-1 flex-col gap-6 lg:flex-row">
					<aside className="w-full shrink-0 lg:w-72">
						<div className="flex flex-col rounded-[1.5rem] border border-black/10 bg-white p-4 shadow-sm lg:sticky lg:top-8">
							<div className="flex items-center justify-between px-1">
								<p className="text-sm font-semibold">Explorer</p>
								<span className="rounded-full bg-black/5 px-2 py-0.5 text-[11px] font-medium text-black/50">{pages.length} {pages.length === 1 ? "page" : "pages"}</span>
							</div>
							<label htmlFor="wiki-filter" className="sr-only">Filter wiki pages</label>
							<input id="wiki-filter" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filter pages…" className="mt-3 h-10 w-full rounded-xl border border-black/10 bg-[#f7f7f5] px-3.5 text-sm outline-none ring-[#6d78a8] transition placeholder:text-black/35 focus:ring-2" />

							{filtered.length === 0 ? (
								<div className="mt-6 rounded-xl border border-dashed border-black/10 px-4 py-8 text-center">
									<p className="text-sm font-medium text-black/60">{pages.length === 0 ? "No wiki pages yet." : "No pages match your filter."}</p>
									{pages.length === 0 && <p className="mt-2 text-xs leading-5 text-black/40">Seed the wiki with <code className="rounded bg-black/5 px-1 py-0.5 font-mono text-[11px]">migrations/0002_seed_wiki.sql</code> to get started.</p>}
								</div>
							) : (
								<nav aria-label="Wiki pages" className="mt-4 space-y-5">
									{groups.map(([type, list]) => (
										<div key={type}>
											<p className="px-2 text-[10px] font-bold uppercase tracking-[0.14em] text-black/35">{typeLabel(type)} · {list.length}</p>
											<ul className="mt-1.5 space-y-0.5">
												{list.map((page) => {
													const isActive = activePage?.id === page.id;
													return (
														<li key={page.id}>
															<Link to={`/wiki/${page.id}`} className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] transition ${isActive ? "bg-[#171717] font-medium text-white" : "font-medium text-black/70 hover:bg-black/5 hover:text-black"}`}>
																<span className={`h-1.5 w-1.5 shrink-0 rounded-full ${isActive ? "bg-[#b9c8ff]" : "bg-black/20"}`} aria-hidden />
																<span className="truncate">{page.title}</span>
															</Link>
														</li>
													);
												})}
											</ul>
										</div>
									))}
								</nav>
							)}

							<p className="mt-5 border-t border-black/5 pt-3 text-[11px] leading-5 text-black/35">Markdown notes, maintained in public. Rendered live from the vault.</p>
						</div>
					</aside>

					<section className="min-w-0 flex-1">
						{error && (
							<div className="rounded-[1.5rem] border border-[#e7c9a8] bg-[#fdf3e7] px-6 py-5">
								<p className="text-sm font-medium text-[#8a5a26]">{error}</p>
							</div>
						)}

						{!error && !pageExists && params.pageId != null && (
							<div className="grid min-h-[24rem] place-items-center rounded-[1.5rem] border border-black/10 bg-white px-6 py-16 text-center">
								<div>
									<div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#e5ebff] text-2xl">◇</div>
									<h1 className="mt-5 text-lg font-semibold">Page not found</h1>
									<p className="mt-2 max-w-xs text-sm leading-6 text-black/45">That wiki page doesn’t exist (yet). Pick another page from the explorer.</p>
									<Link to="/wiki" className="mt-5 inline-flex h-10 items-center rounded-xl bg-[#171717] px-4 text-sm font-medium text-white transition hover:bg-black">Back to the wiki</Link>
								</div>
							</div>
						)}

						{!error && !activePage && (
							<div className="grid min-h-[24rem] place-items-center rounded-[1.5rem] border border-black/10 bg-white px-6 py-16 text-center">
								<div>
									<div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#e5ebff] text-2xl">✦</div>
									<h1 className="mt-5 text-lg font-semibold">The wiki is empty.</h1>
									<p className="mt-2 max-w-xs text-sm leading-6 text-black/45">No pages have been published yet. Seed the database and the explorer will fill in here.</p>
								</div>
							</div>
						)}

						{activePage && (
							<article className="rounded-[1.5rem] border border-black/10 bg-white px-6 py-8 shadow-sm sm:px-10 sm:py-10">
								<div className="flex flex-wrap items-center gap-2">
									<span className="rounded-full bg-[#e5ebff] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#4b5b8f]">{typeLabel(activePage.type)}</span>
									<span className="text-xs text-black/35">Public wiki page</span>
								</div>
								<h1 className="mt-4 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">{activePage.title}</h1>
								<hr className="my-6 border-black/10" />
								<div className="wiki-prose" dangerouslySetInnerHTML={{ __html: activeHtml }} />
								<hr className="my-8 border-black/10" />
								<div className="flex items-center justify-between text-xs text-black/40">
									<span>Maintained by the archivists.</span>
									<Link to="/wiki" className="font-medium text-black/60 transition hover:text-black">Browse all pages →</Link>
								</div>
							</article>
						)}
					</section>
				</div>
			</div>
		</main>
	);
}
