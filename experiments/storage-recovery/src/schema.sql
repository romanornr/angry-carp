
CREATE TABLE cases (id TEXT PRIMARY KEY, revision INTEGER NOT NULL,
  support TEXT NOT NULL CHECK(support IN ('sufficient', 'insufficient')), reason TEXT NOT NULL);
CREATE TABLE originals (import_id TEXT PRIMARY KEY, case_id TEXT REFERENCES cases(id),
  content BLOB NOT NULL, digest TEXT NOT NULL, method TEXT NOT NULL, acquired_at TEXT NOT NULL);
CREATE TABLE observations (case_id TEXT PRIMARY KEY REFERENCES cases(id),
  resource_status TEXT NOT NULL, source TEXT NOT NULL);
CREATE TABLE reports (case_id TEXT REFERENCES cases(id), provider TEXT NOT NULL,
  status TEXT NOT NULL, payload BLOB, receipt TEXT, reason TEXT NOT NULL,
  PRIMARY KEY(case_id, provider));
CREATE TABLE checkpoints (scope TEXT PRIMARY KEY, position TEXT NOT NULL);
CREATE TRIGGER original_immutable BEFORE UPDATE ON originals
  BEGIN SELECT RAISE(ABORT, 'original is immutable'); END;
CREATE TRIGGER conflicting_import BEFORE INSERT ON originals
  WHEN EXISTS(SELECT 1 FROM originals WHERE import_id = NEW.import_id
    AND (content != NEW.content OR case_id != NEW.case_id))
  BEGIN SELECT RAISE(ABORT, 'conflicting original import'); END;
