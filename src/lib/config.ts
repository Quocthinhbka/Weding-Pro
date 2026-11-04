import "server-only";
import { defaultQuiz, type QuizQuestion } from "@/content/quiz";
import { defaultConfig, type WeddingConfig } from "@/content/wedding";
import { get, run } from "./db";
import { mergeDefaults } from "./merge";

// Cấu hình thiệp lưu dạng JSON trong bảng settings. Đọc lại mỗi lần (rất nhanh với SQLite),
// nên lưu xong là mọi trang thấy ngay, không cần bộ nhớ đệm.

function readSetting(key: string) {
  const row = get<{ value: string }>("SELECT value FROM settings WHERE key = ?", key);
  if (!row) return undefined;
  try {
    return JSON.parse(row.value) as unknown;
  } catch {
    return undefined;
  }
}

function writeSetting(key: string, value: unknown) {
  run(
    `INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    key,
    JSON.stringify(value),
    Date.now(),
  );
}

export function getConfig(): WeddingConfig {
  return mergeDefaults(defaultConfig, readSetting("wedding"));
}

export function saveConfig(config: WeddingConfig) {
  writeSetting("wedding", config);
}

/** Câu đố kèm đáp án – chỉ dùng trên máy chủ. */
export function getQuiz(): QuizQuestion[] {
  const stored = readSetting("quiz");
  return Array.isArray(stored) && stored.length > 0 ? (stored as QuizQuestion[]) : defaultQuiz;
}

export function saveQuiz(quiz: QuizQuestion[]) {
  writeSetting("quiz", quiz);
}
