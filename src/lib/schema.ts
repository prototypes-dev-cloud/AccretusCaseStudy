import { db } from './db';

export function runMigrations() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS qi_entity (
      id            TEXT PRIMARY KEY,
      name          TEXT NOT NULL,
      logo_initials TEXT NOT NULL,
      primary_color TEXT NOT NULL,
      logo_path     TEXT,
      website       TEXT,
      phone         TEXT,
      email         TEXT,
      address       TEXT
    );

    CREATE TABLE IF NOT EXISTS partners (
      id                TEXT PRIMARY KEY,
      organization_name TEXT NOT NULL,
      type              TEXT NOT NULL,
      logo_initials     TEXT NOT NULL,
      primary_color     TEXT NOT NULL,
      logo_path         TEXT,
      contact_name      TEXT NOT NULL,
      contact_email     TEXT NOT NULL,
      contact_phone     TEXT NOT NULL,
      website           TEXT,
      address           TEXT,
      joined_date       TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS exchanges (
      id                        TEXT PRIMARY KEY,
      client_name               TEXT NOT NULL,
      client_email              TEXT NOT NULL,
      partner_id                TEXT NOT NULL REFERENCES partners(id),
      stage                     TEXT NOT NULL,
      prop_address              TEXT NOT NULL,
      prop_city                 TEXT NOT NULL,
      prop_state                TEXT NOT NULL,
      prop_type                 TEXT NOT NULL,
      sale_price                REAL NOT NULL,
      relinquished_date         TEXT NOT NULL,
      rep_address               TEXT,
      rep_city                  TEXT,
      rep_state                 TEXT,
      rep_type                  TEXT,
      rep_price                 REAL,
      closing_date              TEXT NOT NULL,
      deadline_45_day           TEXT NOT NULL,
      deadline_180_day          TEXT NOT NULL,
      escrow_status             TEXT NOT NULL DEFAULT 'Pending',
      escrow_notes              TEXT NOT NULL DEFAULT '',
      at_risk                   INTEGER NOT NULL DEFAULT 0,
      funds_amount              REAL NOT NULL DEFAULT 0,
      created_at                TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS milestones (
      id          TEXT PRIMARY KEY,
      exchange_id TEXT NOT NULL REFERENCES exchanges(id) ON DELETE CASCADE,
      label       TEXT NOT NULL,
      date        TEXT NOT NULL,
      completed   INTEGER NOT NULL DEFAULT 0,
      current     INTEGER NOT NULL DEFAULT 0,
      sort_order  INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS artifact_logs (
      id          TEXT PRIMARY KEY,
      partner_id  TEXT NOT NULL REFERENCES partners(id),
      exchange_id TEXT NOT NULL REFERENCES exchanges(id),
      action      TEXT NOT NULL,
      timestamp   TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_exchanges_partner ON exchanges(partner_id);
    CREATE INDEX IF NOT EXISTS idx_milestones_exchange ON milestones(exchange_id);
    CREATE INDEX IF NOT EXISTS idx_logs_partner ON artifact_logs(partner_id);
    CREATE INDEX IF NOT EXISTS idx_logs_exchange ON artifact_logs(exchange_id);
  `);

  // Non-destructive migrations: add logo_path if upgrading an existing DB
  const qiCols = db.prepare("PRAGMA table_info(qi_entity)").all() as { name: string }[];
  if (!qiCols.some(c => c.name === 'logo_path')) {
    db.exec('ALTER TABLE qi_entity ADD COLUMN logo_path TEXT');
  }
  const partnerCols = db.prepare("PRAGMA table_info(partners)").all() as { name: string }[];
  if (!partnerCols.some(c => c.name === 'logo_path')) {
    db.exec('ALTER TABLE partners ADD COLUMN logo_path TEXT');
  }
}
