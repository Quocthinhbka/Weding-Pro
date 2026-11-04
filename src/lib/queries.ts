import "server-only";
import crypto from "node:crypto";
import { customAlphabet } from "nanoid";
import { memoryMinMsPerPair, quizMinMsPerQuestion } from "@/content/games";
import { memoryImages } from "@/content/wedding";
import { getConfig, getQuiz } from "./config";
import { all, get, run, tx } from "./db";
import { pickPrize, scoreQuiz, type PrizeRow } from "./game-logic";
import type { Guest } from "./guest";

const claimCode = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 6);

/* ---------- Xác nhận tham dự ---------- */

export type Rsvp = {
  id: number;
  guest_id: number;
  name: string;
  attending: number;
  party_size: number;
  side: string;
  events: string;
  phone: string | null;
  note: string | null;
  lucky_number: number | null;
  created_at: number;
  updated_at: number;
};

export function rsvpOf(guestId: number) {
  return get<Rsvp>("SELECT * FROM rsvps WHERE guest_id = ?", guestId);
}

export function saveRsvp(
  guest: Guest,
  input: { name: string; attending: boolean; partySize: number; side: string; events: string[]; phone: string | null; note: string | null },
) {
  return tx(() => {
    const now = Date.now();
    const existing = rsvpOf(guest.id);
    const events = JSON.stringify(input.events);
    if (existing) {
      run(
        `UPDATE rsvps SET name = ?, attending = ?, party_size = ?, side = ?, events = ?, phone = ?, note = ?, updated_at = ?
         WHERE id = ?`,
        input.name,
        input.attending ? 1 : 0,
        input.partySize,
        input.side,
        events,
        input.phone,
        input.note,
        now,
        existing.id,
      );
    } else {
      run(
        `INSERT INTO rsvps (guest_id, name, attending, party_size, side, events, phone, note, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        guest.id,
        input.name,
        input.attending ? 1 : 0,
        input.partySize,
        input.side,
        events,
        input.phone,
        input.note,
        now,
        now,
      );
    }
    // Số may mắn cấp một lần và giữ nguyên; lúc bốc thăm chỉ xét khách đang "có tham dự".
    if (input.attending) {
      run(
        `UPDATE rsvps SET lucky_number = (SELECT COALESCE(MAX(lucky_number), 0) + 1 FROM rsvps)
         WHERE guest_id = ? AND lucky_number IS NULL`,
        guest.id,
      );
    }
    return rsvpOf(guest.id)!;
  });
}

/* ---------- Sổ lưu bút ---------- */

export type Wish = { id: number; name: string; message: string; hidden: number; created_at: number };

export function visibleWishes(limit = 200) {
  return all<Wish>("SELECT * FROM wishes WHERE hidden = 0 ORDER BY created_at DESC LIMIT ?", limit);
}

export function addWish(guestId: number | null, name: string, message: string) {
  const result = run(
    "INSERT INTO wishes (guest_id, name, message, created_at) VALUES (?, ?, ?, ?)",
    guestId,
    name,
    message,
    Date.now(),
  );
  return get<Wish>("SELECT * FROM wishes WHERE id = ?", Number(result.lastInsertRowid))!;
}

/* ---------- Video ---------- */

export type Video = {
  id: number;
  name: string;
  message: string | null;
  original_file: string;
  file: string | null;
  mime: string | null;
  poster: string | null;
  size: number;
  status: "processing" | "ready" | "failed";
  approved: number;
  created_at: number;
};

export function publicVideos() {
  return all<Pick<Video, "id" | "name" | "message" | "poster" | "created_at">>(
    "SELECT id, name, message, poster, created_at FROM videos WHERE approved = 1 AND status = 'ready' ORDER BY created_at DESC",
  );
}

/* ---------- Vòng quay ---------- */

export type Spin = { id: number; prize_label: string; is_win: number; claim_code: string | null; claimed_at: number | null; prize_id: number };

export function wheelPrizesPublic() {
  return all<Pick<PrizeRow, "id" | "label" | "color">>("SELECT id, label, color FROM prizes ORDER BY sort, id");
}

export function spinOf(guestId: number) {
  return get<Spin>("SELECT * FROM spins WHERE guest_id = ?", guestId);
}

export function spinWheel(guestId: number): { spin: Spin; already: boolean } | { error: string } {
  return tx(() => {
    const existing = spinOf(guestId);
    if (existing) return { spin: existing, already: true };
    const prizes = all<PrizeRow>("SELECT * FROM prizes ORDER BY sort, id");
    const prize = pickPrize(prizes, crypto.randomInt(0, 1_000_000) / 1_000_000);
    if (!prize) return { error: "Vòng quay tạm hết giải, bạn quay lại sau nhé!" };
    if (prize.stock !== null) run("UPDATE prizes SET stock = stock - 1 WHERE id = ?", prize.id);
    run(
      "INSERT INTO spins (guest_id, prize_id, prize_label, is_win, claim_code, created_at) VALUES (?, ?, ?, ?, ?, ?)",
      guestId,
      prize.id,
      prize.label,
      prize.is_win,
      prize.is_win ? claimCode() : null,
      Date.now(),
    );
    return { spin: spinOf(guestId)!, already: false };
  });
}

/* ---------- Đố vui & lật hình ---------- */

export type Attempt = {
  id: number;
  guest_id: number;
  game: "quiz" | "memory";
  started_at: number;
  finished_at: number | null;
  score: number | null;
  total: number | null;
  moves: number | null;
  duration_ms: number | null;
};

export function quizAttemptOf(guestId: number) {
  // Chỉ lượt đầu tiên được tính.
  return get<Attempt>("SELECT * FROM game_attempts WHERE guest_id = ? AND game = 'quiz' ORDER BY id LIMIT 1", guestId);
}

export function startQuiz(guestId: number) {
  const existing = quizAttemptOf(guestId);
  if (existing) return existing;
  const result = run(
    "INSERT INTO game_attempts (guest_id, game, started_at, total) VALUES (?, 'quiz', ?, ?)",
    guestId,
    Date.now(),
    getQuiz().length,
  );
  return get<Attempt>("SELECT * FROM game_attempts WHERE id = ?", Number(result.lastInsertRowid))!;
}

export function submitQuiz(guestId: number, answers: (number | null)[]) {
  return tx(() => {
    const attempt = quizAttemptOf(guestId);
    if (!attempt) return { error: "Bạn chưa bắt đầu lượt chơi" as const };
    if (attempt.finished_at) return { attempt, already: true };
    const quiz = getQuiz();
    const now = Date.now();
    // Người thật không thể đọc và trả lời nhanh hơn ~0,8 giây mỗi câu.
    if (now - attempt.started_at < quiz.length * quizMinMsPerQuestion) {
      return { error: "Bạn trả lời nhanh quá! Hãy đọc kỹ câu hỏi rồi gửi lại nhé." as const };
    }
    // Hết giờ vẫn chấm, nhưng thời gian tính tối đa bằng tổng thời gian cho phép (+5 giây trễ mạng).
    const maxMs = (quiz.length * getConfig().games.quizSeconds + 5) * 1000;
    const duration = Math.min(now - attempt.started_at, maxMs);
    const score = scoreQuiz(answers, quiz.map((q) => q.answer));
    run(
      "UPDATE game_attempts SET finished_at = ?, score = ?, duration_ms = ? WHERE id = ?",
      now,
      score,
      duration,
      attempt.id,
    );
    return { attempt: quizAttemptOf(guestId)!, already: false };
  });
}

export function startMemory(guestId: number) {
  const result = run("INSERT INTO game_attempts (guest_id, game, started_at) VALUES (?, 'memory', ?)", guestId, Date.now());
  return Number(result.lastInsertRowid);
}

export function finishMemory(guestId: number, attemptId: number, moves: number) {
  const attempt = get<Attempt>(
    "SELECT * FROM game_attempts WHERE id = ? AND guest_id = ? AND game = 'memory'",
    attemptId,
    guestId,
  );
  if (!attempt) return { error: "Không tìm thấy lượt chơi" };
  if (attempt.finished_at) return { attempt };
  const now = Date.now();
  const duration = now - attempt.started_at;
  if (duration < memoryImages(getConfig()).length * memoryMinMsPerPair) return { error: "Kết quả không hợp lệ" };
  run("UPDATE game_attempts SET finished_at = ?, moves = ?, duration_ms = ? WHERE id = ?", now, moves, duration, attempt.id);
  return { attempt: get<Attempt>("SELECT * FROM game_attempts WHERE id = ?", attempt.id)! };
}

export function memoryBestOf(guestId: number) {
  return get<Attempt>(
    `SELECT * FROM game_attempts WHERE guest_id = ? AND game = 'memory' AND finished_at IS NOT NULL
     ORDER BY duration_ms, moves LIMIT 1`,
    guestId,
  );
}

export type LeaderRow = { guest_id: number; name: string; score: number | null; total: number | null; moves: number | null; duration_ms: number };

export function leaderboard(game: "quiz" | "memory", limit = 10) {
  if (game === "quiz") {
    return all<LeaderRow>(
      `SELECT a.guest_id, g.name, a.score, a.total, a.moves, a.duration_ms
       FROM game_attempts a JOIN guests g ON g.id = a.guest_id
       WHERE a.game = 'quiz' AND a.finished_at IS NOT NULL
         AND a.id = (SELECT MIN(id) FROM game_attempts WHERE guest_id = a.guest_id AND game = 'quiz')
       ORDER BY a.score DESC, a.duration_ms ASC LIMIT ?`,
      limit,
    );
  }
  return all<LeaderRow>(
    `SELECT guest_id, name, NULL AS score, NULL AS total, moves, duration_ms FROM (
       SELECT a.guest_id, g.name, a.moves, a.duration_ms,
              ROW_NUMBER() OVER (PARTITION BY a.guest_id ORDER BY a.duration_ms, a.moves) AS rn
       FROM game_attempts a JOIN guests g ON g.id = a.guest_id
       WHERE a.game = 'memory' AND a.finished_at IS NOT NULL
     ) WHERE rn = 1 ORDER BY duration_ms, moves LIMIT ?`,
    limit,
  );
}

/* ---------- Trạng thái của một khách (trả cho trình duyệt) ---------- */

export type GuestState = {
  guest: { name: string; phone: string | null; side: string | null; invited: boolean } | null;
  rsvp: {
    name: string;
    attending: boolean;
    partySize: number;
    side: string;
    events: string[];
    phone: string | null;
    note: string | null;
    luckyNumber: number | null;
  } | null;
  spin: { label: string; isWin: boolean; code: string | null; claimed: boolean } | null;
};

export function guestState(guest: Guest | undefined): GuestState {
  if (!guest) return { guest: null, rsvp: null, spin: null };
  const rsvp = rsvpOf(guest.id);
  const spin = spinOf(guest.id);
  return {
    guest: { name: guest.name, phone: guest.phone, side: guest.side, invited: guest.invite_id !== null },
    rsvp: rsvp
      ? {
          name: rsvp.name,
          attending: rsvp.attending === 1,
          partySize: rsvp.party_size,
          side: rsvp.side,
          events: JSON.parse(rsvp.events) as string[],
          phone: rsvp.phone,
          note: rsvp.note,
          luckyNumber: rsvp.attending === 1 ? rsvp.lucky_number : null,
        }
      : null,
    spin: spin ? { label: spin.prize_label, isWin: spin.is_win === 1, code: spin.claim_code, claimed: !!spin.claimed_at } : null,
  };
}
