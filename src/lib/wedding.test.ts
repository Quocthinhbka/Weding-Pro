import { describe, expect, it } from "vitest";
import { bankAppUrl } from "@/content/banks";
import { couplePhotos, dateInfo, defaultConfig, feastOf, venueQuery, inviteEvent, memoryImages, normalizeConfig, rsvpGroups, sideFromParam } from "@/content/wedding";
import { configSchema, quizSchema } from "./config-schema";
import { canChiYear, lunarText, solarToLunar } from "./lunar";
import { mergeDefaults } from "./merge";
import { buildIcs, eventRange, foldLine, googleCalendarUrl } from "./ics";
import { accrueCredits, levelBonusGiven, withLevelBonus, formatLucky, normalizePhone, pickPrize, scoreQuiz } from "./game-logic";
import { MEMORY_LEVELS } from "@/content/games";
import { daysBetween, monthGrid, timeRemaining, vnDate, vnDay, vnToday } from "./wedding-time";

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
  it("Nghi thức xin dâu 13:00 (+07:00) thành 06:00 UTC", () => {
    const vuQuy = defaultConfig.events.find((e) => e.id === "xin-dau")!;
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
    expect(url.searchParams.get("dates")).toBe("20261129T090000Z/20261129T130000Z");
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
    expect(memoryImages({ ...defaultConfig, album: defaultConfig.album.slice(0, 3) }, 1)).toHaveLength(3);
    expect(memoryImages(defaultConfig, 2)).toHaveLength(8);
    // ảnh chọn riêng cho từng level được ưu tiên, bù bằng album, không trùng; mỗi level đúng số cặp
    const photos = (n: number) => Array.from({ length: n }, (_, i) => `/api/media/p${n}-${i}.webp`);
    const cfg = { ...defaultConfig, games: { ...defaultConfig.games, memoryLevelPhotos: [photos(2), photos(8), []] } };
    const l1 = memoryImages(cfg, 1);
    expect(l1.slice(0, 2)).toEqual(photos(2));
    expect(new Set(l1).size).toBe(6);
    expect(memoryImages(cfg, 2)).toEqual(photos(8));
    expect(memoryImages(cfg, 3)).toEqual(defaultConfig.album.slice(0, 9)); // chưa chọn: dùng album (mặc định chỉ có 9 ảnh)
    expect(configSchema.safeParse(cfg).success).toBe(true);
    expect(configSchema.safeParse({ ...cfg, games: { ...cfg.games, memoryLevelPhotos: [photos(7), [], []] } }).success).toBe(false); // level 1 tối đa 6 ảnh
    expect(configSchema.safeParse({ ...cfg, games: { ...cfg.games, memoryLevelPhotos: [[], []] } }).success).toBe(false);
  });

  it("ảnh trong ngôi nhà: thiệp nhà trai dùng ảnh chính, thiệp nhà gái dùng ảnh riêng, ô trống thì dùng lại ảnh nhà trai", () => {
    const c = { ...defaultConfig, bridePhotos: { groom: "/api/media/g.webp", bride: "" } };
    expect(couplePhotos(c, "groom")).toEqual({ groom: c.groom.photo, bride: c.bride.photo });
    expect(couplePhotos(c, "bride")).toEqual({ groom: "/api/media/g.webp", bride: c.bride.photo });
    expect(configSchema.safeParse(c).success).toBe(true);
    expect(configSchema.safeParse({ ...c, bridePhotos: { groom: "http://x/y.jpg", bride: "" } }).success).toBe(false);
  });

  it("dữ liệu cũ: album chia chủ đề được gộp lại thành một danh sách, hộp mừng có thêm bankApp", () => {
    const old = structuredClone(defaultConfig) as unknown as { album: unknown; gifts: Record<string, unknown>[] };
    old.album = [{ title: "A", images: ["/images/a.svg", "/images/b.svg"] }, { title: "B", images: ["/images/b.svg", "/images/c.svg"] }];
    delete old.gifts[0].bankApp;
    const n = normalizeConfig(old as never);
    expect(n.album).toEqual(["/images/a.svg", "/images/b.svg", "/images/c.svg"]);
    expect(n.gifts[0].bankApp).toBe("");
    expect(configSchema.safeParse(n).success).toBe(true);
    expect(configSchema.safeParse({ ...defaultConfig, album: Array(49).fill("/images/a.svg") }).success).toBe(false);
  });

  it("?f=bride là thiệp nhà gái (Lễ Vu Quy), không có hoặc f=groom là nhà trai (Lễ Thành Hôn)", () => {
    expect(["bride", "groom", undefined, "x"].map(sideFromParam)).toEqual(["bride", "groom", "groom", "groom"]);
    expect(inviteEvent(defaultConfig, "groom").title).toBe("Lễ Thành Hôn");
    expect(inviteEvent(defaultConfig, "bride").title).toBe("Lễ Vu Quy");
    expect(inviteEvent({ ...defaultConfig, sides: { ...defaultConfig.sides, bride: { ...defaultConfig.sides.bride, eventId: "da-xoa" } } }, "bride")?.id).toBe("thanh-hon");
    expect(inviteEvent(defaultConfig, "bride")).toMatchObject({ id: "xin-dau", time: "13:00", title: "Lễ Vu Quy" });
    expect(feastOf(defaultConfig, "groom")?.event).toMatchObject({ time: "17:15", venueId: "nha-hang" });
    expect(feastOf(defaultConfig, "bride")?.venue?.name).toBe("Tư gia nhà gái");
  });

  it("deeplink ngân hàng chỉ có khi chọn ngân hàng hợp lệ", () => {
    expect(bankAppUrl("vcb")).toBe("https://dl.vietqr.io/pay?app=vcb");
    expect(bankAppUrl("")).toBe("");
    expect(bankAppUrl("khong-co")).toBe("");
  });

  it("nội dung nhiều dòng: xuống dòng được lưu nguyên, nhưng địa chỉ gửi Google Maps / lịch chỉ một dòng", () => {
    const c = structuredClone(defaultConfig);
    c.texts.thankYou = "Dòng một\nDòng hai";
    c.venues[0].name = "Nhà hàng\nSao Mai";
    c.venues[0].address = "Số 1\n  Phố A";
    c.events[1].title = "Lễ\năn hỏi";
    const parsed = configSchema.safeParse(c);
    expect(parsed.success).toBe(true);
    expect(parsed.success && parsed.data.texts.thankYou).toBe("Dòng một\nDòng hai");
    expect(venueQuery(c.venues[0])).toBe("Nhà hàng Sao Mai, Số 1 Phố A");
    expect(buildIcs(c, [c.events[1]])).toContain("LOCATION:Nhà hàng Sao Mai\\, Số 1 Phố A");
  });

  it("giờ Việt Nam GMT+7: qua nửa đêm 17:00 UTC là sang ngày mới; lượt quay dồn theo ngày, tối đa 3", () => {
    expect(vnDay(Date.parse("2026-11-04T16:59:59Z"))).toBe("2026-11-04");
    expect(vnDay(Date.parse("2026-11-04T17:00:00Z"))).toBe("2026-11-05");
    expect(vnToday(new Date("2026-12-31T20:00:00Z"))).toEqual({ year: 2027, month: 1, day: 1 });
    expect(daysBetween("2026-11-04", "2026-11-07")).toBe(3);
    expect(daysBetween("2026-12-30", "2027-01-02")).toBe(3);
    expect(accrueCredits(0, 1, 3)).toBe(1);
    expect(accrueCredits(2, 5, 3)).toBe(3);
    expect(accrueCredits(4, 2, 3)).toBe(4); // lượt thưởng vượt mức vẫn giữ
    expect(accrueCredits(1, 0, 3)).toBe(1);
  });

  it("level lật hình: 6 cặp 4×3, 8 cặp 4×4, 10 cặp 4×5, đủ số ô", () => {
    expect(MEMORY_LEVELS.map((l) => [l.pairs, l.cols, l.rows])).toEqual([[6, 4, 3], [8, 4, 4], [10, 4, 5]]);
    expect(MEMORY_LEVELS.map((l) => l.seconds)).toEqual([45, 60, 75]); // đếm ngược theo level
    for (const l of MEMORY_LEVELS) expect(l.pairs * 2).toBe(l.cols * l.rows);
  });

  it("thưởng lượt quay khi hoàn thành level lật hình: mỗi level một lần, các level độc lập", () => {
    let mask = 0;
    expect([1, 2, 3].map((l) => levelBonusGiven(mask, l))).toEqual([false, false, false]);
    mask = withLevelBonus(mask, 2);
    expect([1, 2, 3].map((l) => levelBonusGiven(mask, l))).toEqual([false, true, false]);
    mask = withLevelBonus(withLevelBonus(mask, 1), 3);
    expect([1, 2, 3].every((l) => levelBonusGiven(mask, l))).toBe(true);
    expect(withLevelBonus(mask, 2)).toBe(mask);
  });
});
