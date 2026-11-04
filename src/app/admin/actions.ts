"use server";

import crypto from "node:crypto";
import { customAlphabet } from "nanoid";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { endAdminSession, requireAdmin, startAdminSession } from "@/lib/auth";
import type { QuizQuestion } from "@/content/quiz";
import type { WeddingConfig } from "@/content/wedding";
import { saveConfig, saveQuiz } from "@/lib/config";
import { configSchema, quizSchema } from "@/lib/config-schema";
import { all, get, run, tx } from "@/lib/db";
import { clientIp, rateLimit } from "@/lib/http";
import type { Video } from "@/lib/queries";
import { adminPasswordConfigured, checkPassword } from "@/lib/session";
import { deleteVideoFiles } from "@/lib/video";

const inviteCode = customAlphabet("abcdefghijkmnpqrstuvwxyz23456789", 7);

export async function login(_prev: { error?: string } | undefined, formData: FormData) {
  if (!(await rateLimit("admin-login", 8, 15 * 60_000))) return { error: "Thử quá nhiều lần, vui lòng đợi 15 phút." };
  if (!adminPasswordConfigured()) return { error: "Máy chủ chưa đặt mã quản trị (ADMIN_PASSWORD trong file .env)." };
  if (!checkPassword(String(formData.get("password") ?? ""))) {
    console.warn("[admin] đăng nhập sai từ", await clientIp());
    return { error: "Mã quản trị chưa đúng" };
  }
  await startAdminSession();
  redirect("/admin/cau-hinh");
}

export async function logout() {
  await endAdminSession();
  redirect("/admin/login");
}

/* ---------- Cấu hình thiệp ---------- */

export async function saveSettings(config: WeddingConfig, quiz: QuizQuestion[]) {
  await requireAdmin();
  const parsedConfig = configSchema.safeParse(config);
  if (!parsedConfig.success) return { error: parsedConfig.error.issues[0]?.message ?? "Cấu hình chưa hợp lệ" };
  const parsedQuiz = quizSchema.safeParse(quiz);
  if (!parsedQuiz.success) return { error: parsedQuiz.error.issues[0]?.message ?? "Câu đố chưa hợp lệ" };
  saveConfig(parsedConfig.data);
  saveQuiz(parsedQuiz.data);
  refresh();
  return { ok: true as const };
}

/* ---------- Khách mời ---------- */

export async function createInvites(text: string, side: string) {
  await requireAdmin();
  const names = text
    .split(/\r?\n/)
    .map((s) => s.trim().slice(0, 80))
    .filter(Boolean)
    .slice(0, 500);
  const sideValue = side === "trai" || side === "gai" ? side : null;
  tx(() => {
    for (const name of names) {
      run("INSERT INTO invites (code, display_name, side, created_at) VALUES (?, ?, ?, ?)", inviteCode(), name, sideValue, Date.now());
    }
  });
  refresh();
  return names.length;
}

export async function updateInvite(id: number, displayName: string) {
  await requireAdmin();
  const name = displayName.trim().slice(0, 80);
  if (name) run("UPDATE invites SET display_name = ? WHERE id = ?", name, id);
  refresh();
}

export async function deleteInvite(id: number) {
  await requireAdmin();
  run("DELETE FROM invites WHERE id = ?", id);
  refresh();
}

/* ---------- Xác nhận tham dự & lời chúc ---------- */

export async function deleteRsvp(id: number) {
  await requireAdmin();
  run("DELETE FROM rsvps WHERE id = ?", id);
  refresh();
}

export async function setWishHidden(id: number, hidden: boolean) {
  await requireAdmin();
  run("UPDATE wishes SET hidden = ? WHERE id = ?", hidden ? 1 : 0, id);
  refresh();
}

export async function deleteWish(id: number) {
  await requireAdmin();
  run("DELETE FROM wishes WHERE id = ?", id);
  refresh();
}

/* ---------- Video ---------- */

export async function setVideoApproved(id: number, approved: boolean) {
  await requireAdmin();
  run("UPDATE videos SET approved = ? WHERE id = ?", approved ? 1 : 0, id);
  refresh();
}

export async function deleteVideo(id: number) {
  await requireAdmin();
  const video = get<Video>("SELECT * FROM videos WHERE id = ?", id);
  if (video) {
    deleteVideoFiles(video);
    run("DELETE FROM videos WHERE id = ?", id);
  }
  refresh();
}

/* ---------- Trò chơi ---------- */

export type PrizeInput = { id?: number; label: string; color: string; weight: number; stock: number | null; isWin: boolean };

export async function savePrizes(prizes: PrizeInput[]) {
  await requireAdmin();
  const clean = prizes
    .map((p) => ({
      ...p,
      label: p.label.trim().slice(0, 40),
      color: /^#[0-9a-fA-F]{6}$/.test(p.color) ? p.color : "#FFFDF7",
      weight: Math.max(0, Math.round(Number(p.weight) || 0)),
      stock: p.stock === null || Number.isNaN(Number(p.stock)) ? null : Math.max(0, Math.round(Number(p.stock))),
    }))
    .filter((p) => p.label);
  if (clean.length < 2) return { error: "Vòng quay cần ít nhất 2 ô" };
  tx(() => {
    const keep = new Set<number>();
    clean.forEach((p, i) => {
      if (p.id) {
        run("UPDATE prizes SET label = ?, color = ?, weight = ?, stock = ?, is_win = ?, sort = ? WHERE id = ?", p.label, p.color, p.weight, p.stock, p.isWin ? 1 : 0, i, p.id);
        keep.add(p.id);
      } else {
        const r = run("INSERT INTO prizes (label, color, weight, stock, is_win, sort) VALUES (?, ?, ?, ?, ?, ?)", p.label, p.color, p.weight, p.stock, p.isWin ? 1 : 0, i);
        keep.add(Number(r.lastInsertRowid));
      }
    });
    // Ô đã có người trúng thì không xoá được, chỉ đặt trọng số 0 để không ra nữa.
    for (const { id } of all<{ id: number }>("SELECT id FROM prizes")) {
      if (keep.has(id)) continue;
      const used = get<{ n: number }>("SELECT COUNT(*) AS n FROM spins WHERE prize_id = ?", id)!.n > 0;
      if (used) run("UPDATE prizes SET weight = 0, sort = 999 WHERE id = ?", id);
      else run("DELETE FROM prizes WHERE id = ?", id);
    }
  });
  refresh();
  return { ok: true };
}

export async function setSpinClaimed(id: number, claimed: boolean) {
  await requireAdmin();
  run("UPDATE spins SET claimed_at = ? WHERE id = ?", claimed ? Date.now() : null, id);
  refresh();
}

/* ---------- Bốc số may mắn ---------- */

export async function drawLucky(group: string) {
  await requireAdmin();
  return tx(() => {
    const candidates = all<{ id: number; name: string; lucky_number: number; events: string }>(
      `SELECT id, name, lucky_number, events FROM rsvps
       WHERE attending = 1 AND lucky_number IS NOT NULL
         AND lucky_number NOT IN (SELECT lucky_number FROM draws)`,
    ).filter((r) => group === "all" || (JSON.parse(r.events) as string[]).includes(group));
    if (candidates.length === 0) return { error: "Đã hết số để bốc" };
    const pick = candidates[crypto.randomInt(candidates.length)];
    run("INSERT INTO draws (lucky_number, rsvp_id, name, grp, drawn_at) VALUES (?, ?, ?, ?, ?)", pick.lucky_number, pick.id, pick.name, group, Date.now());
    return { luckyNumber: pick.lucky_number, name: pick.name, pool: candidates.length };
  });
}

export async function undoDraw(id: number) {
  await requireAdmin();
  run("DELETE FROM draws WHERE id = ?", id);
  refresh();
}
