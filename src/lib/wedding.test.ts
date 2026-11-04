import { describe, expect, it } from "vitest";
import { dateInfo, defaultConfig, memoryImages, rsvpGroups } from "@/content/wedding";
import { configSchema, quizSchema } from "./config-schema";
import { canChiYear, lunarText, solarToLunar } from "./lunar";
import { mergeDefaults } from "./merge";
import { buildIcs, eventRange, foldLine, googleCalendarUrl } from "./ics";
import { formatLucky, normalizePhone, pickPrize, scoreQuiz } from "./game-logic";
import { monthGrid, timeRemaining, vnDate } from "./wedding-time";

describe("ngày cưới", () => {
  it("29/11/2026 là Chủ Nhật", () => {
    expect(new Date(Date.UTC(2026, 10, 29)).getUTCDay()).toBe(0);
    expect(dateInfo(defaultConfig).weekday).toBe("Chủ Nhật");
  });

  it("lịch tháng 11/2026 bắt đầu từ Thứ 2, ngày 1 lệch 6 ô", () => {
    const grid = monthGrid(2026, 11);
    expect(grid.slice(0, 7)).toEqual([null, null, null, null, null, null, 1]);
    expect(grid.filter((d) => d !== null)).toHaveLength(30);
    expect(grid.length % 7).toBe(0);
    // Ngày 29 rơi vào cột Chủ Nhật
    expect(grid.indexOf(29) % 7).toBe(6);
  });

  it("đếm ngược tính đúng và dừng ở 0", () => {
    const target = new Date("2026-11-29T10:00:00+07:00");
    expect(timeRemaining(target, new Date("2026-11-28T08:59:30+07:00"))).toEqual({ days: 1, hours: 1, minutes: 0, seconds: 30, done: false });
    expect(timeRemaining(target, new Date("2026-11-30T00:00:00+07:00"))).toMatchObject({ days: 0, seconds: 0, done: true });
  });

  it("giờ Việt Nam được đổi đúng sang UTC", () => {
    expect(vnDate("2026-11-29", "13:00").toISOString()).toBe("2026-11-29T06:00:00.000Z");
  });
});

describe("file lịch .ics", () => {
  it("Lễ Vu Quy 13:00 (+07:00) thành 06:00 UTC", () => {
    const vuQuy = defaultConfig.events.find((e) => e.id === "vu-quy")!;
    expect(eventRange(defaultConfig, vuQuy).start.toISOString()).toBe("2026-11-29T06:00:00.000Z");
    const ics = buildIcs(defaultConfig, [vuQuy], new Date("2026-11-04T00:00:00Z"));
    expect(ics).toContain("DTSTART:20261129T060000Z");
    expect(ics).toContain("DTEND:20261129T080000Z");
    expect(ics).toContain("BEGIN:VEVENT");
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
  });

  it("gập dòng dài theo byte UTF-8, không vượt 75 byte", () => {
    const folded = foldLine("DESCRIPTION:" + "Lễ Thành Hôn ".repeat(20));
    for (const line of folded.split("\r\n")) {
      expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
    }
    expect(folded.replace(/\r\n /g, "")).toBe("DESCRIPTION:" + "Lễ Thành Hôn ".repeat(20));
  });

  it("link Google Calendar chứa khung giờ của địa điểm", () => {
    const url = new URL(googleCalendarUrl(defaultConfig, "nha-hang"));
    expect(url.searchParams.get("dates")).toBe("20261129T100000Z/20261129T130000Z");
  });
});

describe("trò chơi", () => {
  const prizes = [
    { id: 1, weight: 10, stock: 0 },
    { id: 2, weight: 30, stock: null },
    { id: 3, weight: 60, stock: 5 },
  ];

  it("chọn giải theo trọng số và bỏ qua giải đã hết", () => {
    expect(pickPrize(prizes, 0)?.id).toBe(2);
    expect(pickPrize(prizes, 0.33)?.id).toBe(2);
    expect(pickPrize(prizes, 0.34)?.id).toBe(3);
    expect(pickPrize(prizes, 0.9999)?.id).toBe(3);
  });

  it("trả null khi không còn giải nào", () => {
    expect(pickPrize([{ weight: 5, stock: 0 }, { weight: 0, stock: null }], 0.5)).toBeNull();
  });

  it("chấm điểm đố vui", () => {
    expect(scoreQuiz([1, 2, null, 0], [1, 2, 3, 1])).toBe(2);
    expect(scoreQuiz([], [1, 2])).toBe(0);
  });

  it("chuẩn hoá số điện thoại", () => {
    expect(normalizePhone("0912 345 678")).toBe("0912345678");
    expect(normalizePhone("+84 912.345.678")).toBe("0912345678");
    expect(normalizePhone("84912345678")).toBe("0912345678");
    expect(normalizePhone("12345")).toBeNull();
  });

  it("định dạng số may mắn 3 chữ số", () => {
    expect(formatLucky(7)).toBe("007");
    expect(formatLucky(123)).toBe("123");
  });
});

describe("âm lịch", () => {
  it("29/11/2026 là ngày 21 tháng 10 năm Bính Ngọ", () => {
    expect(solarToLunar(29, 11, 2026)).toEqual({ day: 21, month: 10, year: 2026, leap: false });
    expect(lunarText("2026-11-29")).toBe("21 tháng 10 năm Bính Ngọ");
    expect(dateInfo(defaultConfig).lunar).toBe("21 tháng 10 năm Bính Ngọ");
  });

  it("Tết Bính Ngọ là 17/02/2026, ngày trước đó vẫn là năm Ất Tỵ", () => {
    expect(solarToLunar(17, 2, 2026)).toEqual({ day: 1, month: 1, year: 2026, leap: false });
    expect(solarToLunar(16, 2, 2026)).toMatchObject({ month: 12, year: 2025 });
    expect(canChiYear(2025)).toBe("Ất Tỵ");
  });

  it("nhận ra tháng nhuận (tháng 6 nhuận năm Ất Tỵ 2025)", () => {
    expect(solarToLunar(25, 7, 2025)).toEqual({ day: 1, month: 6, year: 2025, leap: true });
    expect(lunarText("2025-07-25")).toBe("1 tháng 6 (nhuận) năm Ất Tỵ");
  });

  it("ghi đè ngày âm lịch bằng tay", () => {
    expect(dateInfo({ ...defaultConfig, date: { ...defaultConfig.date, lunar: "Rằm tháng 10" } }).lunar).toBe("Rằm tháng 10");
  });
});

describe("cấu hình", () => {
  it("cấu hình mặc định hợp lệ", () => {
    const parsed = configSchema.safeParse(defaultConfig);
    expect(parsed.success ? "ok" : parsed.error.issues[0]).toBe("ok");
  });

  it("từ chối đường dẫn ảnh lạ và sự kiện trỏ tới địa điểm không tồn tại", () => {
    expect(configSchema.safeParse({ ...defaultConfig, heroImage: "javascript:alert(1)" }).success).toBe(false);
    expect(configSchema.safeParse({ ...defaultConfig, heroImage: "https://example.com/a.jpg" }).success).toBe(false);
    const events = [{ id: "x", title: "Lễ", time: "10:00", venueId: "khong-co" }];
    expect(configSchema.safeParse({ ...defaultConfig, events, mainEventId: "x" }).success).toBe(false);
    expect(configSchema.safeParse({ ...defaultConfig, heroImage: "/api/media/abcDEF_12-3.webp" }).success).toBe(true);
  });

  it("câu đố phải có đáp án đúng nằm trong các lựa chọn", () => {
    expect(quizSchema.safeParse([{ question: "?", options: ["a", "b"], answer: 1 }]).success).toBe(true);
    expect(quizSchema.safeParse([{ question: "?", options: ["a", "b"], answer: 2 }]).success).toBe(false);
  });

  it("ghép dữ liệu đã lưu với mặc định (trường mới vẫn có giá trị)", () => {
    const merged = mergeDefaults(defaultConfig, { groom: { name: "Thịnh" }, album: ["/api/media/a.webp"] });
    expect(merged.groom).toEqual({ ...defaultConfig.groom, name: "Thịnh" });
    expect(merged.album).toEqual(["/api/media/a.webp"]);
    expect(merged.sections).toEqual(defaultConfig.sections);
  });

  it("mỗi địa điểm là một lựa chọn khi xác nhận; số cặp lật hình không vượt quá album", () => {
    expect(rsvpGroups(defaultConfig).map((g) => g.key)).toEqual(["nha-gai", "nha-hang"]);
    expect(memoryImages({ ...defaultConfig, album: defaultConfig.album.slice(0, 3) })).toHaveLength(3);
    expect(memoryImages(defaultConfig)).toHaveLength(8);
  });
});
