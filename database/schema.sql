PRAGMA journal_mode = WAL;

CREATE TABLE IF NOT EXISTS settings (
  guild_id TEXT PRIMARY KEY,
  admin_role_id TEXT NOT NULL,
  support_role_id TEXT NOT NULL,
  sales_category_id TEXT NOT NULL,
  support_category_id TEXT NOT NULL,
  log_channel_id TEXT NOT NULL,
  payment_qr_code TEXT,
  panel_message_id TEXT
);

CREATE TABLE IF NOT EXISTS users (
  guild_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  last_ticket_at INTEGER,
  PRIMARY KEY (guild_id, user_id)
);

CREATE TABLE IF NOT EXISTS counters (
  guild_id TEXT NOT NULL,
  type TEXT NOT NULL,
  last_number INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (guild_id, type)
);

CREATE TABLE IF NOT EXISTS tickets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  guild_id TEXT NOT NULL,
  channel_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  product_id TEXT,
  number INTEGER NOT NULL,
  status TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  closed_at INTEGER,
  rating INTEGER
);

CREATE TABLE IF NOT EXISTS logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  guild_id TEXT NOT NULL,
  level TEXT NOT NULL,
  message TEXT NOT NULL,
  meta TEXT,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tickets_guild_status ON tickets (guild_id, status);
CREATE INDEX IF NOT EXISTS idx_logs_created_at ON logs (created_at);
