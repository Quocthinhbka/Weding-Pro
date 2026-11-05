// Cấu trúc nội dung thiệp cưới và giá trị mặc định.
// Nội dung thật được chỉnh trong trang /admin/cau-hinh và lưu vào cơ sở dữ liệu;
// giá trị ở đây chỉ dùng khi chưa cấu hình (hoặc khi thêm trường mới).
import { lunarText } from "@/lib/lunar";

export type Person = { name: string; born: string; photo: string };
export type FamilyMember = { role: string; name: string };
export type Family = { label: string; members: FamilyMember[] };
export type Venue = {
  id: string;
  name: string;
  address: string;
  /** Toạ độ ghim chính xác ("lat,lng"). Để trống thì dùng địa chỉ để tìm. */
  latLng: string;
  /** Tên hiển thị trong form xác nhận tham dự, VD "Lễ Vu Quy · Ninh Bình". */
  rsvpLabel: string;
};
/** `venueId` để trống = mốc không gắn địa điểm (VD đoàn nhà trai xuất phát từ tư gia). */
export type WeddingEvent = { id: string; title: string; time: string; venueId: string };
/** Thiết lập riêng cho từng bên mời: sự kiện và tên hiện ở thẻ mời, buổi tiệc thân mật hiện ở phần gia đình. */
export type SideInfo = { eventId: string; title: string; feastEventId: string };
export type StoryItem = { title: string; text: string; image: string };
export type Gift = {
  title: string;
  bank: string;
  accountNumber: string;
  accountName: string;
  qr: string;
  /** Mã ứng dụng ngân hàng (xem content/banks.ts). Có thì bấm vào mã QR sẽ mở thẳng ứng dụng đó. */
  bankApp: string;
};

/** Giới hạn để mỗi sector vẫn vừa trong 1,75 màn hình. */
export const MAX_STORY = 4;
export const MAX_ALBUM = 48;

export const SECTION_LABELS = {
  music: "Giai điệu hạnh phúc (thẻ nhạc)",
  loveStory: "Câu chuyện tình yêu",
  album: "Album cưới",
  guestbook: "Sổ lưu bút",
  video: "Video chúc mừng",
  games: "Trò chơi có thưởng",
  gifts: "Hộp mừng cưới",
} as const;
export type SectionKey = keyof typeof SECTION_LABELS;

export type WeddingConfig = {
  groom: Person;
  bride: Person;
  families: { trai: Family; gai: Family };
  date: {
    iso: string; // YYYY-MM-DD
    /** Để trống thì tự tính từ ngày dương lịch. */
    lunar: string;
    /** Đồng hồ đếm ngược chạy tới giờ này của ngày cưới (giờ Việt Nam). */
    countdownTime: string;
  };
  venues: Venue[];
  events: WeddingEvent[];
  /** Nhà trai (link thường hoặc ?f=groom) và nhà gái (?f=bride). */
  sides: Record<"groom" | "bride", SideInfo>;
  texts: { invitation: string; invitationBride: string; thankYou: string; guestFallback: string };
  heroImage: string;
  music: { src: string; title: string; artist: string };
  loveStory: StoryItem[];
  album: string[];
  gifts: Gift[];
  sections: Record<SectionKey, boolean>;
  games: { quizSeconds: number };
};

export const defaultConfig: WeddingConfig = {
  groom: { name: "Quốc Thịnh", born: "", photo: "/images/groom.svg" },
  bride: { name: "Minh Trang", born: "", photo: "/images/bride.svg" },
  families: {
    trai: { label: "Nhà trai", members: [{ role: "Mẹ", name: "Ninh Thị Thảo" }] },
    gai: {
      label: "Nhà gái",
      members: [
        { role: "Bố", name: "Đàm Minh Phẩm" },
        { role: "Mẹ", name: "Vũ Thị Hồng" },
      ],
    },
  },
  date: { iso: "2026-11-29", lunar: "", countdownTime: "10:00" },
  venues: [
    { id: "nha-gai", name: "Tư gia nhà gái", address: "Dịch Diệp, Ninh Giang, Ninh Bình", latLng: "", rsvpLabel: "Lễ Vu Quy · Ninh Bình" },
    {
      id: "nha-hang",
      name: "Trung tâm Hội nghị Tiệc cưới Khách sạn A15",
      address: "55 Trần Hòa, Định Công, Hoàng Mai, Hà Nội",
      latLng: "",
      rsvpLabel: "Lễ Thành Hôn · Hà Nội",
    },
  ],
  events: [
    { id: "xuat-phat", title: "Đoàn nhà trai xuất phát từ tư gia", time: "06:25", venueId: "" },
    { id: "an-hoi", title: "Trao lễ ăn hỏi", time: "09:00", venueId: "nha-gai" },
    { id: "huong-nha-gai", title: "Thắp hương gia tiên", time: "09:15", venueId: "nha-gai" },
    { id: "com-nha-gai", title: "Bữa cơm thân mật", time: "10:00", venueId: "nha-gai" },
    { id: "xin-dau", title: "Nghi thức xin dâu", time: "13:00", venueId: "nha-gai" },
    { id: "don-khach", title: "Đón khách tại nhà hàng", time: "16:00", venueId: "nha-hang" },
    { id: "don-dau", title: "Đón dâu về nhà chồng", time: "17:00", venueId: "nha-hang" },
    { id: "huong-nha-hang", title: "Thắp hương gia tiên", time: "17:10", venueId: "nha-hang" },
    { id: "com-nha-hang", title: "Bữa cơm thân mật", time: "17:15", venueId: "nha-hang" },
    { id: "thanh-hon", title: "Lễ Thành Hôn", time: "18:00", venueId: "nha-hang" },
  ],
  sides: {
    groom: { eventId: "thanh-hon", title: "Lễ Thành Hôn", feastEventId: "com-nha-hang" },
    bride: { eventId: "xin-dau", title: "Lễ Vu Quy", feastEventId: "com-nha-gai" },
  },
  texts: {
    invitation: "Trân trọng kính mời quý khách đến dự buổi lễ thành hôn và chung vui cùng gia đình chúng tôi!",
    invitationBride: "Trân trọng kính mời quý khách đến dự buổi lễ vu quy và chung vui cùng gia đình chúng tôi!",
    thankYou: "Sự hiện diện của bạn sẽ khiến hôn lễ của chúng tôi trở nên ý nghĩa hơn bao giờ hết!",
    guestFallback: "Bạn & người thương",
  },
  heroImage: "/images/hero.svg",
  music: { src: "", title: "Giai điệu hạnh phúc", artist: "Quốc Thịnh & Minh Trang" },
  loveStory: [
    { title: "Lần đầu gặp gỡ", text: "Một ngày bình thường bỗng trở nên đặc biệt, khi hai ánh mắt tình cờ chạm nhau.", image: "/images/story-1.svg" },
    { title: "Hẹn hò", text: "Những buổi hẹn giản dị, những con đường quen thuộc, và vô vàn câu chuyện không muốn kết thúc.", image: "/images/story-2.svg" },
    { title: "Lời cầu hôn", text: "Một câu hỏi, một cái gật đầu, và một lời hứa đi cùng nhau thật lâu.", image: "/images/story-3.svg" },
    { title: "Về chung một nhà", text: "Một ngày để nhớ, một đời để thương.", image: "/images/story-4.svg" },
  ],
  album: Array.from({ length: 9 }, (_, i) => `/images/album-${i + 1}.svg`),
  gifts: [
    { title: "Mừng cưới chú rể", bank: "Tên ngân hàng", accountNumber: "0000000000", accountName: "TEN CHU TAI KHOAN", qr: "/images/qr-groom.svg", bankApp: "" },
    { title: "Mừng cưới cô dâu", bank: "Tên ngân hàng", accountNumber: "0000000000", accountName: "TEN CHU TAI KHOAN", qr: "/images/qr-bride.svg", bankApp: "" },
  ],
  sections: { music: true, loveStory: true, album: true, guestbook: true, video: true, games: true, gifts: true },
  games: { quizSeconds: 20 },
};

/* ---------- Giá trị suy ra từ cấu hình ---------- */

const WEEKDAYS = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];

export function dateInfo(c: WeddingConfig) {
  const [year, month, day] = c.date.iso.split("-").map(Number);
  return {
    day,
    month,
    year,
    weekday: WEEKDAYS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()],
    lunar: c.date.lunar.trim() || lunarText(c.date.iso),
    dots: `${String(day).padStart(2, "0")}.${String(month).padStart(2, "0")}.${year}`,
    countdownTo: `${c.date.iso}T${c.date.countdownTime}:00+07:00`,
  };
}

export function coupleNames(c: WeddingConfig) {
  return `${c.groom.name} & ${c.bride.name}`;
}

export function venueById(c: WeddingConfig, id: string) {
  return c.venues.find((v) => v.id === id);
}

export function eventsAt(c: WeddingConfig, venueId: string) {
  return c.events.filter((e) => e.venueId === venueId).sort((a, b) => a.time.localeCompare(b.time));
}


/** Lựa chọn "sẽ dự" trong form xác nhận: mỗi địa điểm là một lựa chọn. */
export function rsvpGroups(c: WeddingConfig) {
  return c.venues.map((v) => ({ key: v.id, label: v.rsvpLabel || v.name }));
}

/** Ảnh cho một level lật hình: lấy các ảnh đầu của album. Album chưa đủ ảnh thì level đó chưa chơi được (trả về mảng ngắn hơn). */
export function memoryImages(c: WeddingConfig, pairs: number) {
  return c.album.slice(0, pairs);
}

/** Link mở thiệp có ?f=bride là thiệp nhà gái, còn lại (kể cả ?f=groom) là thiệp nhà trai. */
export type Side = "groom" | "bride";
export const sideFromParam = (f: unknown): Side => (f === "bride" ? "bride" : "groom");

/**
 * Thứ tự cô dâu chú rể: thiệp nhà gái (?f=bride) đưa cô dâu lên trước (bên trái), thiệp nhà trai thì chú rể trước.
 */
export function coupleOrder(c: WeddingConfig, side: Side) {
  const groom = { key: "groom" as const, person: c.groom, role: "Chú rể" };
  const bride = { key: "bride" as const, person: c.bride, role: "Cô dâu" };
  return side === "bride" ? [bride, groom] : [groom, bride];
}

/** Sự kiện và tên hiện ở thẻ "Trân trọng kính mời": nhà trai Lễ Thành Hôn, nhà gái Lễ Vu Quy. */
export function inviteEvent(c: WeddingConfig, side: Side) {
  const info = c.sides[side];
  const event = c.events.find((e) => e.id === info.eventId) ?? c.events[c.events.length - 1];
  return event && { ...event, title: info.title || event.title };
}

/** Buổi tiệc thân mật của từng bên (giờ + địa điểm), hiện ở phần đại diện gia đình. */
export function feastOf(c: WeddingConfig, side: Side) {
  const event = c.events.find((e) => e.id === c.sides[side].feastEventId);
  return event && { event, venue: venueById(c, event.venueId) };
}

/** Dữ liệu cấu hình cũ (album chia chủ đề, hộp mừng chưa có ngân hàng) → cấu trúc hiện tại. */
export function normalizeConfig(c: WeddingConfig): WeddingConfig {
  const album = c.album as unknown as (string | { images: string[] })[];
  if (album.some((a) => typeof a !== "string")) {
    c.album = [...new Set(album.flatMap((a) => (typeof a === "string" ? [a] : a.images)))];
  }
  c.sides ??= structuredClone(defaultConfig.sides);
  c.gifts = c.gifts.map((g) => ({ ...g, bankApp: g.bankApp ?? "" }));
  return c;
}

export function venueQuery(venue: Venue) {
  return venue.latLng.trim() || `${venue.name}, ${venue.address}`.replace(/\s+/g, " ");
}

export function mapEmbedUrl(venue: Venue) {
  return `https://maps.google.com/maps?q=${encodeURIComponent(venueQuery(venue))}&z=16&output=embed`;
}

export function directionsUrl(venue: Venue) {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(venueQuery(venue))}`;
}

export function mapsSearchUrl(venue: Venue) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venueQuery(venue))}`;
}
