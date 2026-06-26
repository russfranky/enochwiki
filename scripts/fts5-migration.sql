-- FTS5 virtual tables for full-text search
-- These are kept in sync by application code (triggers or manual reindex)

CREATE VIRTUAL TABLE IF NOT EXISTS verses_fts USING fts5(
  ref,
  text,
  book_name,
  content='Verse',
  content_rowid='rowid'
);

CREATE VIRTUAL TABLE IF NOT EXISTS sources_fts USING fts5(
  title,
  summary,
  content,
  domain,
  content='Source',
  content_rowid='rowid'
);

CREATE VIRTUAL TABLE IF NOT EXISTS evidence_fts USING fts5(
  scripture_ref,
  claim,
  corroboration,
  notes,
  content='Evidence',
  content_rowid='rowid'
);

-- Triggers to keep verses_fts in sync with Verse table
CREATE TRIGGER IF NOT EXISTS verses_ai AFTER INSERT ON Verse BEGIN
  INSERT INTO verses_fts(rowid, ref, text, book_name)
  VALUES (NEW.rowid, NEW.bookId || '-' || NEW.chapterNum || ':' || NEW.verseNum, NEW.text, '');
END;

CREATE TRIGGER IF NOT EXISTS verses_ad AFTER DELETE ON Verse BEGIN
  INSERT INTO verses_fts(verses_fts, rowid, ref, text, book_name) VALUES('delete', OLD.rowid, '', '', '');
END;

CREATE TRIGGER IF NOT EXISTS verses_au AFTER UPDATE ON Verse BEGIN
  INSERT INTO verses_fts(verses_fts, rowid, ref, text, book_name) VALUES('delete', OLD.rowid, '', '', '');
  INSERT INTO verses_fts(rowid, ref, text, book_name) VALUES (NEW.rowid, NEW.bookId || '-' || NEW.chapterNum || ':' || NEW.verseNum, NEW.text, '');
END;

-- Triggers for sources_fts
CREATE TRIGGER IF NOT EXISTS sources_ai AFTER INSERT ON Source BEGIN
  INSERT INTO sources_fts(rowid, title, summary, content, domain)
  VALUES (NEW.rowid, NEW.title, COALESCE(NEW.summary,''), COALESCE(NEW.content,''), NEW.domain);
END;

CREATE TRIGGER IF NOT EXISTS sources_ad AFTER DELETE ON Source BEGIN
  INSERT INTO sources_fts(sources_fts, rowid, title, summary, content, domain) VALUES('delete', OLD.rowid, '','','','');
END;

CREATE TRIGGER IF NOT EXISTS sources_au AFTER UPDATE ON Source BEGIN
  INSERT INTO sources_fts(sources_fts, rowid, title, summary, content, domain) VALUES('delete', OLD.rowid, '','','','');
  INSERT INTO sources_fts(rowid, title, summary, content, domain) VALUES (NEW.rowid, NEW.title, COALESCE(NEW.summary,''), COALESCE(NEW.content,''), NEW.domain);
END;

-- Triggers for evidence_fts
CREATE TRIGGER IF NOT EXISTS evidence_ai AFTER INSERT ON Evidence BEGIN
  INSERT INTO evidence_fts(rowid, scripture_ref, claim, corroboration, notes)
  VALUES (NEW.rowid, NEW.scriptureRef, NEW.claim, NEW.corroboration, COALESCE(NEW.notes,''));
END;

CREATE TRIGGER IF NOT EXISTS evidence_ad AFTER DELETE ON Evidence BEGIN
  INSERT INTO evidence_fts(evidence_fts, rowid, scripture_ref, claim, corroboration, notes) VALUES('delete', OLD.rowid, '','','','');
END;

CREATE TRIGGER IF NOT EXISTS evidence_au AFTER UPDATE ON Evidence BEGIN
  INSERT INTO evidence_fts(evidence_fts, rowid, scripture_ref, claim, corroboration, notes) VALUES('delete', OLD.rowid, '','','','');
  INSERT INTO evidence_fts(rowid, scripture_ref, claim, corroboration, notes) VALUES (NEW.rowid, NEW.scriptureRef, NEW.claim, NEW.corroboration, COALESCE(NEW.notes,''));
END;
