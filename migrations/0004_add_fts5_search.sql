-- Full-text search over wiki_pages using SQLite FTS5.
--
-- External-content FTS5 table: the canonical text stays in wiki_pages and the
-- virtual table only stores the inverted index (single source of truth).
-- Triggers keep the index in sync on insert/update/delete; the backfill below
-- indexes rows seeded by migrations 0002/0003.

CREATE VIRTUAL TABLE IF NOT EXISTS wiki_fts USING fts5(
    title,
    content,
    type,
    content='wiki_pages',
    content_rowid='rowid',
    tokenize='porter'
);

-- Keep the index in sync with wiki_pages.
CREATE TRIGGER IF NOT EXISTS wiki_fts_ai AFTER INSERT ON wiki_pages BEGIN
    INSERT INTO wiki_fts(rowid, title, content, type)
    VALUES (new.rowid, new.title, new.content, new.type);
END;

CREATE TRIGGER IF NOT EXISTS wiki_fts_ad AFTER DELETE ON wiki_pages BEGIN
    INSERT INTO wiki_fts(wiki_fts, rowid, title, content, type)
    VALUES ('delete', old.rowid, old.title, old.content, old.type);
END;

CREATE TRIGGER IF NOT EXISTS wiki_fts_au AFTER UPDATE ON wiki_pages BEGIN
    INSERT INTO wiki_fts(wiki_fts, rowid, title, content, type)
    VALUES ('delete', old.rowid, old.title, old.content, old.type);
    INSERT INTO wiki_fts(rowid, title, content, type)
    VALUES (new.rowid, new.title, new.content, new.type);
END;

-- Index rows already present (seeded by earlier migrations).
INSERT INTO wiki_fts(rowid, title, content, type)
SELECT rowid, title, content, type FROM wiki_pages;