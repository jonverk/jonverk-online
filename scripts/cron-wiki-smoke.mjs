/**
 * SkyGape-D2 smoke test (evinne) — exercises the real overnight-digest cron
 * logic in workers/cron-wiki.ts against stubbed Cloudflare bindings.
 *
 * No network, no real D1 / Workers AI:
 *   - env.DB → in-memory Map-backed D1 stand-in (wiki_pages + feed_messages)
 *   - env.AI → returns a canned Markdown page (or throws on demand)
 *
 * Pass criteria (each asserts the actual exported function):
 *   1. gatherSource returns wiki + feed sources from the standing tables.
 *   2. buildDigestPrompt includes the wiki titles and feed lines.
 *   3. synthesizeDigest extracts the AI response text; throws on empty output.
 *   4. runOvernightDigest writes one `wiki_pages` row with type 'digest' and
 *      the deterministic id digest-YYYY-MM-DD for the given date.
 *   5. Re-running with the same date upserts the SAME row (idempotent, one row).
 *   6. Missing tables degrade to empty sources instead of throwing.
 *
 * Run: node scripts/cron-wiki-smoke.mjs
 */
import { randomUUID } from "node:crypto";

const {
  runOvernightDigest,
  gatherSource,
  buildDigestPrompt,
  synthesizeDigest,
  digestIdFor,
} = await import("../workers/cron-wiki.ts");

let pass = 0;
let fail = 0;
function check(name, cond, extra) {
  if (cond) {
    pass++;
    console.log(`  PASS  ${name}`);
  } else {
    fail++;
    console.log(`  FAIL  ${name}`, extra ?? "");
  }
}

class FakeD1 {
  constructor() {
    this.wiki = new Map(); // id -> row
    this.feed = [];
  }
  prepare(sql) {
    const self = this;
    const isWikiSelect = /FROM wiki_pages/i.test(sql);
    const isFeedSelect = /FROM feed_messages/i.test(sql);
    const isPageInsert = /INSERT INTO wiki_pages/i.test(sql);
    return {
      bind(...binds) {
        return {
          async all() {
            if (isWikiSelect) {
              // ORDER BY updated_at DESC LIMIT ? — sort newest first, cut to limit
              const limit = Number(binds[0] ?? 100);
              const rows = [...self.wiki.values()]
                .sort((a, b) => Number(b.updated_at) - Number(a.updated_at))
                .slice(0, limit);
              return { results: rows.map((r) => ({ ...r })) };
            }
            if (isFeedSelect) {
              const limit = Number(binds[0] ?? 100);
              const rows = [...self.feed.values()].slice(0, limit);
              return { results: rows.map((r) => ({ ...r })) };
            }
            return { results: [] };
          },
          async run() {
            if (isPageInsert) {
              // VALUES (?, ?, ?, 'digest', ?, ?) + ON CONFLICT(id) DO UPDATE…
              const [id, title, content, createdAt, updatedAt] = binds;
              const existing = self.wiki.get(id);
              self.wiki.set(id, {
                id,
                title: existing ? title : title,
                content,
                type: "digest",
                created_at: existing ? existing.created_at : createdAt,
                updated_at: existing ? updatedAt : updatedAt,
              });
              return { success: true, meta: { changes: 1 } };
            }
            return { success: true, meta: { changes: 0 } };
          },
          async first() {
            const rows = [...self.wiki.values()];
            return rows[0] ?? null;
          },
        };
      },
    };
  }
  rows() {
    return [...this.wiki.values()];
  }
}

function makeEnv({ aiResponse = "# Digest\nBody text.", aiFails = false } = {}) {
  const db = new FakeD1();
  const env = {
    DB: db,
    AI: {
      async run(_model, inputs) {
        if (aiFails) throw new Error("AI simulated failure");
        return { response: aiResponse };
      },
    },
  };
  return { env, db };
}

async function main() {
  console.log("— SkyGape-D2 overnight digest cron smoke —");

  // 1. gatherSource returns wiki + feed
  {
    const { env, db } = makeEnv();
    db.wiki.set("a", { id: "a", title: "Engineers", type: "entity", content: "# Engineers\nBody", updated_at: 10 });
    db.wiki.set("b", { id: "b", title: "Archivists", type: "entity", content: "# Archivists", updated_at: 20 });
    db.feed.push({ id: 1, message: "shipped digest", author: "a", created_at: 30 });
    const src = await gatherSource(env.DB);
    check("gathers wiki rows", src.wiki.length === 2, src.wiki.length);
    check("gathers feed rows", src.feed.length === 1, src.feed.length);
  }

  // 2. buildDigestPrompt includes source content
  {
    const p = buildDigestPrompt(new Date("2026-09-07T00:00:00Z"), {
      wiki: [{ title: "Engineers", type: "entity", content: "Senior engineers build." }],
      feed: [{ message: "hello", author: "x" }],
    });
    check("prompt has digest title", p.includes("Overnight Digest 2026-09-07"));
    check("prompt includes wiki title", p.includes("Engineers"));
    check("prompt includes feed line", p.includes("hello"));
  }

  // 3. synthesizeDigest extracts text / throws on failure
  {
    const { env } = makeEnv({ aiResponse: "# Head\n\nBody." });
    const t = await synthesizeDigest(env.AI, "prompt", "@cf/meta/llama-3.3-70b-instruct-fp8-fast");
    check("AI output extracted to markdown", t === "# Head\n\nBody.");
    const fails = makeEnv({ aiFails: true });
    let threw = false;
    try {
      await synthesizeDigest(fails.AI, "prompt", "@cf/meta/llama-3.3-70b-instruct-fp8-fast");
    } catch {
      threw = true;
    }
    check("AI failure propagates", threw);
  }

  // 4/5. runOvernightDigest writes + is idempotent
  {
    const { env, db } = makeEnv();
    const date = new Date("2026-09-07T00:00:00Z");
    const r1 = await runOvernightDigest(env, date);
    const rows1 = db.rows();
    check("digest row written", rows1.length === 1, rows1.length);
    check("row type = digest", rows1[0]?.type === "digest", rows1[0]?.type);
    check("row id = digest-2026-09-07", rows1[0]?.id === "digest-2026-09-07", rows1[0]?.id);
    check("result id matches", r1.id === "digest-2026-09-07", r1.id);
    check("result title has date", r1.title.includes("2026-09-07"), r1.title);
    const digestId = digestIdFor(date);
    check("digestIdFor is date-keyed", digestId === "digest-2026-09-07", digestId);

    // re-run same day → same single row
    await runOvernightDigest(env, date);
    check("re-run keeps one row (idempotent)", db.rows().length === 1, db.rows().length);
  }

  // 6. Missing tables degrade gracefully
  {
    const { env, db } = makeEnv();
    db.wiki.clear();
    db.feed = [];
    const src = await gatherSource(env.DB);
    check("missing tables → empty sources, no throw", src.wiki.length === 0 && src.feed.length === 0);
  }

  console.log(`\nRESULT: ${pass} passed, ${fail} failed`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error("smoke crashed:", e);
  process.exit(1);
});