// Các phép tính ngày giờ thuần tuý (không phụ thuộc máy chủ), có test kèm theo.

export type Remaining = { days: number; hours: number; minutes: number; seconds: number; done: boolean };

export function timeRemaining(target: Date, now: Date): Remaining {
  const diff = Math.max(0, target.getTime() - now.getTime());
  const totalSeconds = Math.floor(diff / 1000);
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    done: diff === 0,
  };
}

/**
 * Lưới lịch một tháng, tuần bắt đầu từ Thứ 2. Ô trống trước ngày 1 là null.
 * Tháng tính từ 1–12.
 */
export function monthGrid(year: number, month: number): (number | null)[] {
  const first = new Date(Date.UTC(year, month - 1, 1));
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const offset = (first.getUTCDay() + 6) % 7; // CN=0 → 6, T2=1 → 0
  const cells: (number | null)[] = Array.from({ length: offset }, () => null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

/** Ghép ngày ISO và giờ địa phương Việt Nam (+07:00) thành Date. */
export function vnDate(isoDate: string, time: string) {
  return new Date(`${isoDate}T${time}:00+07:00`);
}

export function relativeTimeVi(from: Date, now: Date = new Date()) {
  const rtf = new Intl.RelativeTimeFormat("vi", { numeric: "auto" });
  const seconds = Math.round((from.getTime() - now.getTime()) / 1000);
  const abs = Math.abs(seconds);
  if (abs < 45) return "vừa xong";
  if (abs < 3600) return rtf.format(Math.round(seconds / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(seconds / 3600), "hour");
  if (abs < 86400 * 30) return rtf.format(Math.round(seconds / 86400), "day");
  return from.toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
}

export function formatDuration(ms: number) {
  const s = ms / 1000;
  if (s < 60) return `${s.toFixed(1)} giây`;
  const m = Math.floor(s / 60);
  return `${m} phút ${Math.round(s % 60)} giây`;
}

/** Ngày hiện tại theo giờ Việt Nam (GMT+7), không phụ thuộc múi giờ của máy chủ hay của khách. */
export function vnToday(now: Date = new Date()) {
  const [year, month, day] = new Date(now.getTime() + 7 * 3600_000).toISOString().slice(0, 10).split("-").map(Number);
  return { year, month, day };
}

/** Chuỗi ngày YYYY-MM-DD theo giờ Việt Nam của một mốc thời gian (ms). */
export function vnDay(ms: number) {
  return new Date(ms + 7 * 3600_000).toISOString().slice(0, 10);
}

/** Số ngày (theo giờ Việt Nam) từ ngày `from` đến ngày `to`, dạng YYYY-MM-DD. */
export function daysBetween(from: string, to: string) {
  return Math.round((Date.parse(to + "T00:00:00Z") - Date.parse(from + "T00:00:00Z")) / 86_400_000);
}

/** Giờ:phút ngày/tháng theo giờ Việt Nam (GMT+7), VD "14:05 04/11". */
export function formatVnTime(ms: number) {
  return new Date(ms).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", hour12: false });
}
