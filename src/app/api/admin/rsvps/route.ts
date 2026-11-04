import { rsvpGroups } from "@/content/wedding";
import { isAdmin } from "@/lib/auth";
import { getConfig } from "@/lib/config";
import { all } from "@/lib/db";
import { formatLucky } from "@/lib/game-logic";
import type { Rsvp } from "@/lib/queries";

function csvCell(value: unknown) {
  const s = value === null || value === undefined ? "" : String(value);
  // Chặn công thức Excel trong dữ liệu khách nhập (=, +, -, @).
  const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
  return `"${safe.replace(/"/g, '""')}"`;
}

export async function GET() {
  if (!(await isAdmin())) return new Response("Chưa đăng nhập", { status: 401 });
  const rows = all<Rsvp>("SELECT * FROM rsvps ORDER BY side, name");
  const groups = rsvpGroups(getConfig());
  const header = ["Tên", "Tham dự", "Số người", "Bên", ...groups.map((g) => g.label), "Số điện thoại", "Số may mắn", "Lời nhắn", "Cập nhật lúc"];
  const lines = rows.map((r) => {
    const events = JSON.parse(r.events) as string[];
    return [
      r.name,
      r.attending ? "Có" : "Không",
      r.attending ? r.party_size : 0,
      r.side === "trai" ? "Nhà trai" : "Nhà gái",
      ...groups.map((g) => (events.includes(g.key) ? "x" : "")),
      r.phone,
      r.attending && r.lucky_number ? formatLucky(r.lucky_number) : "",
      r.note,
      new Date(r.updated_at).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" }),
    ]
      .map(csvCell)
      .join(",");
  });
  // BOM để Excel nhận đúng tiếng Việt.
  const body = "﻿" + [header.map(csvCell).join(","), ...lines].join("\r\n");
  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="xac-nhan-tham-du.csv"`,
    },
  });
}
