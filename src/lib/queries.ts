import "server-only";
import crypto from "node:crypto";
import { customAlphabet } from "nanoid";
import { MAX_SPIN_CREDITS, MEMORY_GRACE_SECONDS, memoryLevel, memoryMinMsPerPair, QUIZ_BONUS_SCORE, quizMinMsPerQuestion } from "@/content/games";
import { getConfig, getQuiz } from "./config";
import { all, get, run, tx } from "./db";
import { accrueCredits, levelBonusGiven, pickPrize, scoreQuiz, withLevelBonus, type PrizeRow } from "./game-logic";
import type { Guest } from "./guest";
import { daysBetween, vnDay } from "./wedding-time";

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

export type Wish = { id: number; name: string; message: string; hidden: number; private: number; created_at: number };

/** Lời chúc gửi xuống trình duyệt: lời chúc riêng tư không kèm nội dung (message = null) nên không thể đọc được. */
export type PublicWish = { id: number; name: string; message: string | null; private: boolean; created_at: number };

const toPublic = (w: Wish): PublicWish => ({ id: w.id, name: w.name, message: w.private ? null : w.message, private: !!w.private, created_at: w.created_at });

export function visibleWishes(limit = 200) {
  return all<Wish>("SELECT * FROM wishes WHERE hidden = 0 ORDER BY created_at DESC LIMIT ?", limit).map(toPublic);
}

export function addWish(guestId: number | null, name: string, message: string, isPrivate: boolean) {
  const result = run(
    "INSERT INTO wishes (guest_id, name, message, private, created_at) VALUES (?, ?, ?, ?, ?)",
    guestId,
    name,
    message,
    isPrivate ? 1 : 0,
    Date.now(),
  );
  return toPublic(get<Wish>("SELECT * FROM wishes WHERE id = ?", Number(result.lastInsertRowid))!);
}

/* ---------- Vòng quay ---------- */

export type Spin = { id: number; guest_id: number; prize_label: string; is_win: number; claim_code: string | null; claimed_at: number | null; prize_id: number; created_at: number };

export function wheelPrizesPublic() {
  return all<Pick<PrizeRow, "id" | "label" | "color">>("SELECT id, label, color FROM prizes ORDER BY sort, id");
}

/** Lịch sử quay của khách, mới nhất trước. */
function spinsOf(guestId: number) {
  return all<Spin>("SELECT * FROM spins WHERE guest_id = ? ORDER BY id DESC", guestId);
}

/**
 * Số lượt quay hiện có. Mỗi ngày (theo giờ Việt Nam, GMT+7) mỗi tài khoản được tặng thêm 1 lượt, dồn lại tối đa MAX_SPIN_CREDITS;
 * lượt thưởng từ đố vui có thể làm vượt mức này. Cộng dồn theo số ngày đã qua kể từ lần cộng trước.
 */
function refreshCredits(guestId: number, now = Date.now()) {
  // Không tự mở giao dịch (SQLite không lồng được): gọi trong tx(...) khi cần tính nguyên tử.
  const g = get<{ spin_credits: number; credit_day: string | null }>("SELECT spin_credits, credit_day FROM guests WHERE id = ?", guestId)!;
  const today = vnDay(now);
  if (g.credit_day === today) return g.spin_credits;
  const days = g.credit_day ? Math.max(0, daysBetween(g.credit_day, today)) : 0;
  const credits = accrueCredits(g.spin_credits, days, MAX_SPIN_CREDITS);
  run("UPDATE guests SET spin_credits = ?, credit_day = ? WHERE id = ?", credits, today, guestId);
  return credits;
}

export type Winner = { name: string; label: string; at: number };

/** Các lượt quay trúng quà của mọi người chơi (mới nhất trước). Chỉ có tên, giải và giờ: không lộ số điện thoại hay mã đổi quà. */
export function luckyWinners(limit = 40): Winner[] {
  return all<{ name: string; prize_label: string; created_at: number }>(
    `SELECT g.name, s.prize_label, s.created_at FROM spins s JOIN guests g ON g.id = s.guest_id
     WHERE s.is_win = 1 ORDER BY s.id DESC LIMIT ?`,
    limit,
  ).map((r) => ({ name: r.name, label: r.prize_label, at: r.created_at }));
}

export function spinWheel(guestId: number): { spin: Spin; credits: number } | { error: string } {
  return tx(() => {
    const credits = refreshCredits(guestId);
    if (credits <= 0) return { error: "Bạn hết lượt quay rồi. Mỗi ngày bạn được tặng thêm 1 lượt (dồn tối đa 3 lượt)!" };
    const prizes = all<PrizeRow>("SELECT * FROM prizes ORDER BY sort, id");
    const prize = pickPrize(prizes, crypto.randomInt(0, 1_000_000) / 1_000_000);
    if (!prize) return { error: "Vòng quay tạm hết giải, bạn quay lại sau nhé!" };
    if (prize.stock !== null) run("UPDATE prizes SET stock = stock - 1 WHERE id = ?", prize.id);
    run("UPDATE guests SET spin_credits = spin_credits - 1 WHERE id = ?", guestId);
    const result = run(
      "INSERT INTO spins (guest_id, prize_id, prize_label, is_win, claim_code, created_at) VALUES (?, ?, ?, ?, ?, ?)",
      guestId,
      prize.id,
      prize.label,
      prize.is_win,
      prize.is_win ? claimCode() : null,
      Date.now(),
    );
    return { spin: get<Spin>("SELECT * FROM spins WHERE id = ?", Number(result.lastInsertRowid))!, credits: credits - 1 };
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
  level: number;
};

/** Lượt đố vui gần nhất của khách (chơi lại bao nhiêu lần cũng được, mỗi lần là một lượt mới). */
function quizAttemptOf(guestId: number) {
  return get<Attempt>("SELECT * FROM game_attempts WHERE guest_id = ? AND game = 'quiz' ORDER BY id DESC LIMIT 1", guestId);
}

export function startQuiz(guestId: number) {
  const result = run(
    "INSERT INTO game_attempts (guest_id, game, started_at, total) VALUES (?, 'quiz', ?, ?)",
    guestId,
    Date.now(),
    getQuiz().length,
  );
  return get<Attempt>("SELECT * FROM game_attempts WHERE id = ?", Number(result.lastInsertRowid))!;
}

type QuizBonus = "granted" | "already" | "none";

export function submitQuiz(guestId: number, answers: (number | null)[]) {
  return tx(() => {
    const attempt = quizAttemptOf(guestId);
    if (!attempt) return { error: "Bạn chưa bắt đầu lượt chơi" as const };
    if (attempt.finished_at) return { attempt, already: true, bonus: "none" as QuizBonus };
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
    run("UPDATE game_attempts SET finished_at = ?, score = ?, duration_ms = ? WHERE id = ?", now, score, duration, attempt.id);
    // Đúng từ 8 câu: tặng thêm 1 lượt quay, chỉ một lần cho mỗi tài khoản dù chơi lại nhiều lần.
    let bonus: QuizBonus = "none";
    if (score >= Math.min(QUIZ_BONUS_SCORE, quiz.length)) {
      const g = get<{ quiz_bonus: number }>("SELECT quiz_bonus FROM guests WHERE id = ?", guestId)!;
      if (g.quiz_bonus) bonus = "already";
      else {
        refreshCredits(guestId);
        run("UPDATE guests SET spin_credits = spin_credits + 1, quiz_bonus = 1 WHERE id = ?", guestId);
        bonus = "granted";
      }
    }
    return { attempt: quizAttemptOf(guestId)!, already: false, bonus };
  });
}

export function startMemory(guestId: number, level: number) {
  const result = run("INSERT INTO game_attempts (guest_id, game, started_at, level) VALUES (?, 'memory', ?, ?)", guestId, Date.now(), level);
  return Number(result.lastInsertRowid);
}

export function finishMemory(guestId: number, attemptId: number, moves: number) {
  return tx(() => {
    const attempt = get<Attempt>("SELECT * FROM game_attempts WHERE id = ? AND guest_id = ? AND game = 'memory'", attemptId, guestId);
    if (!attempt) return { error: "Không tìm thấy lượt chơi" };
    if (attempt.finished_at) return { attempt, bonus: false };
    const level = memoryLevel(attempt.level);
    if (!level) return { error: "Level không hợp lệ" };
    const now = Date.now();
    const duration = now - attempt.started_at;
    if (duration < level.pairs * memoryMinMsPerPair) return { error: "Kết quả không hợp lệ" };
    // Quá giờ thì không tính (trình duyệt đã báo hết giờ từ trước; đây là kiểm tra lại ở máy chủ).
    if (duration > (level.seconds + MEMORY_GRACE_SECONDS) * 1000) return { error: "Đã hết giờ, lượt chơi này không được tính" };
    run("UPDATE game_attempts SET finished_at = ?, moves = ?, duration_ms = ? WHERE id = ?", now, moves, duration, attempt.id);
    // Hoàn thành một level được tặng 1 lượt quay, mỗi level nhận một lần.
    const g = get<{ memory_bonus: number }>("SELECT memory_bonus FROM guests WHERE id = ?", guestId)!;
    let bonus = false;
    if (!levelBonusGiven(g.memory_bonus, level.level)) {
      refreshCredits(guestId);
      run("UPDATE guests SET spin_credits = spin_credits + 1, memory_bonus = ? WHERE id = ?", withLevelBonus(g.memory_bonus, level.level), guestId);
      bonus = true;
    }
    return { attempt: get<Attempt>("SELECT * FROM game_attempts WHERE id = ?", attempt.id)!, bonus };
  });
}

/** Thành tích tốt nhất ở một level: ít lượt lật nhất, bằng nhau thì nhanh hơn. */
export function memoryBestOf(guestId: number, level: number) {
  return get<Attempt>(
    `SELECT * FROM game_attempts WHERE guest_id = ? AND game = 'memory' AND level = ? AND finished_at IS NOT NULL
     ORDER BY moves, duration_ms LIMIT 1`,
    guestId,
    level,
  );
}

export type LeaderRow = { guest_id: number; name: string; score: number | null; total: number | null; moves: number | null; duration_ms: number };

/**
 * Bảng xếp hạng: đố vui ưu tiên số câu đúng (rồi nhanh hơn); lật hình xếp riêng theo level, ưu tiên ít lượt lật nhất
 * (rồi nhanh hơn). Mỗi khách lấy lượt tốt nhất. Lượt hết giờ chưa hoàn thành thì không có trong bảng.
 */
export function leaderboard(game: "quiz" | "memory", limit = 10, level = 1) {
  if (game === "quiz") {
    return all<LeaderRow>(
      `SELECT guest_id, name, score, total, NULL AS moves, duration_ms FROM (
         SELECT a.guest_id, g.name, a.score, a.total, a.duration_ms,
                ROW_NUMBER() OVER (PARTITION BY a.guest_id ORDER BY a.score DESC, a.duration_ms ASC) AS rn
         FROM game_attempts a JOIN guests g ON g.id = a.guest_id
         WHERE a.game = 'quiz' AND a.finished_at IS NOT NULL
       ) WHERE rn = 1 ORDER BY score DESC, duration_ms ASC LIMIT ?`,
      limit,
    );
  }
  return all<LeaderRow>(
    `SELECT guest_id, name, NULL AS score, NULL AS total, moves, duration_ms FROM (
       SELECT a.guest_id, g.name, a.moves, a.duration_ms,
              ROW_NUMBER() OVER (PARTITION BY a.guest_id ORDER BY a.moves, a.duration_ms) AS rn
       FROM game_attempts a JOIN guests g ON g.id = a.guest_id
       WHERE a.game = 'memory' AND a.level = ? AND a.finished_at IS NOT NULL
     ) WHERE rn = 1 ORDER BY moves, duration_ms LIMIT ?`,
    level,
    limit,
  );
}

/* ---------- Trạng thái của một khách (trả cho trình duyệt) ---------- */

type SpinInfo = { label: string; isWin: boolean; code: string | null; claimed: boolean; at: number };

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
  /** Lượt quay gần nhất. */
  spin: SpinInfo | null;
  /** Lịch sử quay, mới nhất trước. */
  spins: SpinInfo[];
  /** Số lượt quay còn lại. */
  credits: number;
};

const spinInfo = (s: Spin): SpinInfo => ({ label: s.prize_label, isWin: s.is_win === 1, code: s.claim_code, claimed: !!s.claimed_at, at: s.created_at });

export function guestState(guest: Guest | undefined): GuestState {
  if (!guest) return { guest: null, rsvp: null, spin: null, spins: [], credits: 0 };
  const rsvp = rsvpOf(guest.id);
  const spins = spinsOf(guest.id).map(spinInfo);
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
    spin: spins[0] ?? null,
    spins,
    credits: tx(() => refreshCredits(guest.id)),
  };
}
