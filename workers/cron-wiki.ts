/**
 * SkyGape-D2 — Autonomous Overnight Digest Cron (evinne).
 *
 * Scheduled Worker handler that synthesizes a daily "Overnight Digest" wiki
 * page with Workers AI and persists it into the canonical `wiki_pages` D1 store
 * (migrations/0001_initial_schema.sql). The worker's `scheduled` handler is
 * wired into the main worker (workers/app.ts) and fired by the crontrigger
 * declared in wrangler.jsonc (`triggers.crons`), so it runs unattended every
 * night and stays idempotent: one `wiki_pages` row per calendar day.
 *
 * Data flow:
 *   1. `gatherSource` reads the most recently updated wiki pages and the latest
 *      activity-feed rows from D1 (best-effort: a missing/unmigrated table is
 *      treated as empty, never fatal).
 *   2. `buildDigestPrompt` turns that material into a synthesis prompt.
 *   3. `synthesizeDigest` calls `env.AI.run(env.DIGEST_MODEL, …)` and returns
 *      the Markdown digest body.
 *   4. `upsertDigest` writes the result into `wiki_pages` (type `digest`) with a
 *      deterministic id `digest-YYYY-MM-DD`, so re-runs update the same row.
 *
 * Failures throw out of `scheduled` so Cloudflare retries the invocation; the
 * digest row is only written after a successful synthesis, keeping the store
 * consistent. A successful run logs its summary via console.log (observed by
 * the platform's `journal`).
 */

/** Workers AI model used to synthesize the overnight digest. */
export const DIGEST_MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";

/** Maximum number of wiki pages to include as digest context (oldest cut first). */
export const DIGEST_WIKI_LIMIT = 20;

/** Maximum number of feed rows to include as digest context. */
export const DIGEST_FEED_LIMIT = 30;

/** Workers AI inference cap per digest run. */
export const DIGEST_MAX_TOKENS = 1024;

export interface DigestSource {
  wiki: Array<Record<string, unknown>>;
  feed: Array<Record<string, unknown>>;
}

export interface DigestResult {
  id: string;
  title: string;
  characterCount: number;
  sources: DigestSource;
  ranAt: number;
}

/** Deterministic, date-keyed wiki page id: `digest-YYYY-MM-DD`. */
export function digestIdFor(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `digest-${y}-${m}-${d}`;
}

/** Human-readable title for the daily digest page. */
export function digestTitleFor(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `Overnight Digest ${y}-${m}-${d}`;
}

/**
 * Pull the digest source corpus from D1.
 *
 * `wiki_pages` is canonical; `feed_messages` is provided by migration 0000 but
 * may be absent in fresh/provisioned DBs — each query is individually guarded so
 * a missing table degrades to an empty source instead of failing the cron.
 */
export async function gatherSource(
  db: D1Database,
  wikiLimit = DIGEST_WIKI_LIMIT,
  feedLimit = DIGEST_FEED_LIMIT,
): Promise<DigestSource> {
  let wiki = [] as Array<Record<string, unknown>>;
  let feed = [] as Array<Record<string, unknown>>;

  try {
    const res = await db
      .prepare(
        "SELECT id, title, type, content, updated_at FROM wiki_pages ORDER BY updated_at DESC LIMIT ?",
      )
      .bind(wikiLimit)
      .all<Record<string, unknown>>();
    wiki = res.results ?? [];
  } catch {
    // Table not present yet — proceed without wiki context.
  }

  try {
    const res = await db
      .prepare(
        "SELECT * FROM feed_messages ORDER BY created_at DESC LIMIT ?",
      )
      .bind(feedLimit)
      .all<Record<string, unknown>>();
    feed = res.results ?? [];
  } catch {
    // Table not present yet — proceed without feed context.
  }

  return { wiki, feed };
}

/**
 * Build the synthesis prompt. The model is asked to produce a self-contained
 * Markdown wiki page (digest style), grounded strictly in the provided sources.
 */
export function buildDigestPrompt(date: Date, source: DigestSource): string {
  const lines: string[] = [
    "You are JonVerk's overnight wiki librarian. Produce a concise, well-structured",
    "encyclopedic 'Overnight Digest' wiki page as Markdown, strictly grounded in the",
    "source material below. Use a single H1 title, 2-4 H2 sections (Summary,",
    "Highlights, Trending Topics), short paragraphs, and a closing '## Related'",
    "bullet list. If a section has nothing to say, omit it. Output only Markdown.",
    "",
    `Date: ${digestTitleFor(date)}`,
  ];

  if (source.wiki.length > 0) {
    lines.push("", "Existing wiki pages (most recently updated first):");
    for (const page of source.wiki) {
      const title = String(page.title ?? "?");
      const type = String(page.type ?? "page");
      const body = String(page.content ?? "").replace(/\s+/g, " ").slice(0, 600);
      lines.push(`- [${title}] (${type}): ${body}`);
    }
  } else {
    lines.push("", "Existing wiki pages: (none available)");
  }

  if (source.feed.length > 0) {
    lines.push("", "Latest activity feed entries:");
    for (const entry of source.feed) {
      const author = String(entry.author ?? "?");
      const msg = String(entry.message ?? "").replace(/\s+/g, " ").slice(0, 300);
      lines.push(`- ${author}: ${msg}`);
    }
  } else {
    lines.push("", "Latest activity feed entries: (none available)");
  }

  lines.push("", "Write the digest now.");
  return lines.join("\n");
}

/** Extract a Markdown body from any Workers AI run result. */
export function textOfAiOutput(output: unknown): string {
  if (typeof output === "string") return output;
  if (output && typeof output === "object") {
    const rec = output as Record<string, unknown>;
    if (typeof rec.response === "string") return rec.response;
    if (typeof rec.output === "string") return rec.output;
    if (Array.isArray(rec.output)) {
      const text = rec.output.map((o) => String(o)).join("\n");
      if (text) return text;
    }
    if (typeof rec.text === "string") return rec.text;
  }
  return "";
}

/**
 * Run the Workers AI synthesis for the digest.
 * `ai` is cast to a minimal shape so callers (including the smoke test) can
 * inject a stub while the real binding satisfies it structurally.
 */
export async function synthesizeDigest(
  ai: Pick<Ai, "run">,
  prompt: string,
  model = DIGEST_MODEL,
): Promise<string> {
  const out = await ai.run(model, {
    prompt,
    max_tokens: DIGEST_MAX_TOKENS,
    temperature: 0.3,
  } as Record<string, unknown>);
  const text = textOfAiOutput(out) ?? "";
  if (!text.trim()) throw new Error("Workers AI returned an empty digest");
  return text.trim();
}

/**
 * Persist the digest into `wiki_pages` idempotently (upsert on the deterministic
 * per-day id). Returns the stored page's title and the sha-like body length for
 * the run summary.
 */
export async function upsertDigest(
  db: D1Database,
  date: Date,
  markdown: string,
): Promise<{ id: string; title: string }> {
  const id = digestIdFor(date);
  const title = digestTitleFor(date);
  const now = Math.floor(Date.now() / 1000);

  const res = await db
    .prepare(
      `INSERT INTO wiki_pages (id, title, content, type, created_at, updated_at)
       VALUES (?, ?, ?, 'digest', ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         title = excluded.title,
         content = excluded.content,
         updated_at = excluded.updated_at`,
    )
    .bind(id, title, markdown, now, now)
    .run();

  if (!res.success) throw new Error(`digest upsert failed for ${id}`);
  return { id, title };
}

/** Run a single overnight-digest cycle. Exported for the smoke test & manual runs. */
export async function runOvernightDigest(
  env: Pick<Env, "DB" | "AI">,
  date: Date = new Date(),
): Promise<DigestResult> {
  const source = await gatherSource(env.DB);
  const prompt = buildDigestPrompt(date, source);
  const markdown = await synthesizeDigest(env.AI, prompt, DIGEST_MODEL);
  const { id, title } = await upsertDigest(env.DB, date, markdown);

  return {
    id,
    title,
    characterCount: markdown.length,
    sources: source,
    ranAt: Date.now(),
  };
}

/**
 * Cloudflare `scheduled` handler — invoked by the crontrigger in wrangler.jsonc.
 * Throwing surfaces a retry; the idempotent upsert keeps retries safe.
 */
export async function scheduled(
  controller: ScheduledController,
  env: Env,
  ctx: ExecutionContext,
): Promise<void> {
  try {
    const result = await runOvernightDigest(env);
    // Log asynchronously but keep the handler window open for the summary.
    ctx.waitUntil(
      Promise.resolve().then(() =>
        console.log(
          `[cron-wiki] ${result.title} written (${result.characterCount} chars, ` +
            `${result.sources.wiki.length} wiki pages, ${result.sources.feed.length} feed rows)`,
        ),
      ),
    );
  } catch (err) {
    console.error(
      "[cron-wiki] overnight digest failed:",
      err instanceof Error ? err.message : String(err),
    );
    throw err;
  }
}

export default { scheduled };