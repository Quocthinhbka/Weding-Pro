import "server-only";
import fs from "node:fs";
import path from "node:path";
import { DatabaseSync, type SQLInputValue } from "node:sqlite";
import { wheelPrizes } from "@/content/quiz";

// Má»—i pháº§n tá»­ lÃ  má»™t bÆ°á»›c nÃ¢ng cáº¥p cáº¥u trÃºc dá»¯ liá»‡u. Chá»‰ thÃªm bÆ°á»›c má»›i vÃ o cuá»‘i,
// khÃ´ng sá»­a cÃ¡c bÆ°á»›c Ä‘Ã£ cháº¡y trÃªn mÃ¡y chá»§.
const MIGRATIONS: string[] = [
  `
  CREATE TABLE invites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    side TEXT,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE guests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    token TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    phone TEXT UNIQUE,
    invite_id INTEGER REFERENCES invites(id) ON DELETE SET NULL,
    side TEXT,
    created_at INTEGER NOT NULL
  );
  CREATE INDEX guests_invite ON guests(invite_id);
  CREATE TABLE rsvps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guest_id INTEGER NOT NULL UNIQUE REFERENCES guests(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    attending INTEGER NOT NULL,
    party_size INTEGER NOT NULL,
    side TEXT NOT NULL,
    events TEXT NOT NULL,
    phone TEXT,
    note TEXT,
    lucky_number INTEGER UNIQUE,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );
  CREATE TABLE wishes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guest_id INTEGER REFERENCES guests(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    message TEXT NOT NULL,
    hidden INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE videos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guest_id INTEGER REFERENCES guests(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    message TEXT,
    original_file TEXT NOT NULL,
    file TEXT,
    mime TEXT,
    poster TEXT,
    size INTEGER NOT NULL,
    status TEXT NOT NULL,
    approved INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE prizes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    label TEXT NOT NULL,
    color TEXT NOT NULL,
    weight INTEGER NOT NULL,
    stock INTEGER,
    is_win INTEGER NOT NULL,
    sort INTEGER NOT NULL
  );
  CREATE TABLE spins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guest_id INTEGER NOT NULL UNIQUE REFERENCES guests(id) ON DELETE CASCADE,
    prize_id INTEGER NOT NULL REFERENCES prizes(id),
    prize_label TEXT NOT NULL,
    is_win INTEGER NOT NULL,
    claim_code TEXT UNIQUE,
    claimed_at INTEGER,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE game_attempts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guest_id INTEGER NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
    game TEXT NOT NULL,
    started_at INTEGER NOT NULL,
    finished_at INTEGER,
    score INTEGER,
    total INTEGER,
    moves INTEGER,
    duration_ms INTEGER
  );
  CREATE INDEX attempts_game ON game_attempts(game, guest_id);
  CREATE TABLE draws (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lucky_number INTEGER NOT NULL UNIQUE,
    rsvp_id INTEGER REFERENCES rsvps(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    grp TEXT NOT NULL,
    drawn_at INTEGER NOT NULL
  );
  `,
  // Cáº¥u hÃ¬nh thiá»‡p chá»‰nh tá»« trang quáº£n trá»‹. Lá»±a chá»n "sáº½ dá»±" chuyá»ƒn sang dÃ¹ng mÃ£ Ä‘á»‹a Ä‘iá»ƒm.
  `
  CREATE TABLE settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at INTEGER NOT NULL
  );
  UPDATE rsvps SET events = REPLACE(REPLACE(events, '"vu-quy"', '"nha-gai"'), '"thanh-hon"', '"nha-hang"');
  UPDATE draws SET grp = CASE grp WHEN 'vu-quy' THEN 'nha-gai' WHEN 'thanh-hon' THEN 'nha-hang' ELSE grp END;
  `,
  // Lời chúc riêng tư: vẫn hiện trên thiệp nhưng nội dung bị làm mờ, chỉ cô dâu chú rể đọc được trong trang quản trị.
  `ALTER TABLE wishes ADD COLUMN private INTEGER NOT NULL DEFAULT 0;`,
  // Vòng quay nhiều lượt: bỏ UNIQUE(guest_id) của spins (SQLite phải dựng lại bảng), khách có số lượt quay (mỗi ngày +1, tối đa 3),
  // thưởng đố vui nhận một lần, trò lật hình có level.
  `
  CREATE TABLE spins_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guest_id INTEGER NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
    prize_id INTEGER NOT NULL REFERENCES prizes(id),
    prize_label TEXT NOT NULL,
    is_win INTEGER NOT NULL,
    claim_code TEXT UNIQUE,
    claimed_at INTEGER,
    created_at INTEGER NOT NULL
  );
  INSERT INTO spins_new (id, guest_id, prize_id, prize_label, is_win, claim_code, claimed_at, created_at)
    SELECT id, guest_id, prize_id, prize_label, is_win, claim_code, claimed_at, created_at FROM spins;
  DROP TABLE spins;
  ALTER TABLE spins_new RENAME TO spins;
  CREATE INDEX spins_guest ON spins(guest_id);
  ALTER TABLE guests ADD COLUMN spin_credits INTEGER NOT NULL DEFAULT 0;
  ALTER TABLE guests ADD COLUMN credit_day TEXT;
  ALTER TABLE guests ADD COLUMN quiz_bonus INTEGER NOT NULL DEFAULT 0;
  UPDATE guests SET spin_credits = CASE WHEN EXISTS (SELECT 1 FROM spins WHERE spins.guest_id = guests.id) THEN 0 ELSE 1 END,
                    credit_day = date('now', '+7 hours');
  ALTER TABLE game_attempts ADD COLUMN level INTEGER NOT NULL DEFAULT 2;
  `,
  // Hoàn thành mỗi level lật hình được thưởng 1 lượt quay (một lần cho mỗi level): ghi nhớ bằng bitmask.
  `ALTER TABLE guests ADD COLUMN memory_bonus INTEGER NOT NULL DEFAULT 0;`,
];

const globalForDb = globalThis as unknown as { weddingDb?: DatabaseSync };

function dataDir() {
  return process.env.DATA_DIR || path.join(process.cwd(), "data");
}

export function uploadDir() {
  return process.env.UPLOAD_DIR || path.join(dataDir(), "uploads");
}

function open() {
  const file = process.env.DATABASE_PATH || path.join(dataDir(), "wedding.db");
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;");
  migrate(db);
  return db;
}

function migrate(db: DatabaseSync) {
  const { user_version: version } = db.prepare("PRAGMA user_version").get() as { user_version: number };
  for (let i = version; i < MIGRATIONS.length; i++) {
    transaction(db, () => {
      db.exec(MIGRATIONS[i]);
      db.exec(`PRAGMA user_version = ${i + 1}`);
    });
  }
  const { n } = db.prepare("SELECT COUNT(*) AS n FROM prizes").get() as { n: number };
  if (n === 0) {
    const insert = db.prepare(
      "INSERT INTO prizes (label, color, weight, stock, is_win, sort) VALUES (?, ?, ?, ?, ?, ?)",
    );
    wheelPrizes.forEach((p, i) => insert.run(p.label, p.color, p.weight, p.stock, p.isWin ? 1 : 0, i));
  }
}

function getDb() {
  globalForDb.weddingDb ??= open();
  return globalForDb.weddingDb;
}

/**
 * Cháº¡y fn trong má»™t giao dá»‹ch ghi. node:sqlite lÃ  Ä‘á»“ng bá»™ nÃªn khÃ´ng cÃ³ request nÃ o
 * khÃ¡c chen vÃ o giá»¯a chá»«ng â€“ miá»…n lÃ  fn khÃ´ng await.
 */
function transaction<T>(db: DatabaseSync, fn: () => T): T {
  db.exec("BEGIN IMMEDIATE");
  try {
    const result = fn();
    db.exec("COMMIT");
    return result;
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }
}

// node:sqlite tráº£ vá» object khÃ´ng cÃ³ prototype; React khÃ´ng truyá»n Ä‘Æ°á»£c loáº¡i nÃ y
// xuá»‘ng client component nÃªn chuyá»ƒn thÃ nh object thÆ°á»ng.
export function all<T>(sql: string, ...params: SQLInputValue[]): T[] {
  return getDb()
    .prepare(sql)
    .all(...params)
    .map((row) => ({ ...row }) as T);
}

export function get<T>(sql: string, ...params: SQLInputValue[]): T | undefined {
  const row = getDb().prepare(sql).get(...params);
  return row ? ({ ...row } as T) : undefined;
}

export function run(sql: string, ...params: SQLInputValue[]) {
  return getDb().prepare(sql).run(...params);
}

export function tx<T>(fn: () => T): T {
  return transaction(getDb(), fn);
}
