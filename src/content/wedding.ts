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
export type WeddingEvent = { id: string; title: string; time: string; venueId: string };
export type StoryItem = { title: string; text: string; image: string };
export type Gift = { title: string; bank: string; accountNumber: string; accountName: string; qr: string };

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
  /** Sự kiện được làm nổi bật ở phần "Trân trọng kính mời bạn tới dự". */
  mainEventId: string;
  texts: { invitation: string; thankYou: string; guestFallback: string };
  heroImage: string;
  music: { src: string; title: string; artist: string };
  loveStory: StoryItem[];
  album: string[];
  gifts: Gift[];
  sections: Record<SectionKey, boolean>;
  games: { quizSeconds: number; memoryPairs: number };
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
    { id: "com-nha-gai", title: "Bữa cơm thân mật", time: "10:00", venueId: "nha-gai" },
    { id: "vu-quy", title: "Lễ Vu Quy", time: "13:00", venueId: "nha-gai" },
    { id: "com-nha-hang", title: "Bữa cơm thân mật", time: "17:00", venueId: "nha-hang" },
    { id: "thanh-hon", title: "Lễ Thành Hôn", time: "18:00", venueId: "nha-hang" },
  ],
  mainEventId: "thanh-hon",
  texts: {
    invitation: "Trân trọng kính mời quý khách đến dự buổi lễ thành hôn và chung vui cùng gia đình chúng tôi!",
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
    { title: "Mừng cưới chú rể", bank: "Tên ngân hàng", accountNumber: "0000000000", accountName: "TEN CHU TAI KHOAN", qr: "/images/qr-groom.svg" },
    { title: "Mừng cưới cô dâu", bank: "Tên ngân hàng", accountNumber: "0000000000", accountName: "TEN CHU TAI KHOAN", qr: "/images/qr-bride.svg" },
  ],
  sections: { music: true, loveStory: true, album: true, guestbook: true, video: true, games: true, gifts: true },
  games: { quizSeconds: 20, memoryPairs: 8 },
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

export function mainEvent(c: WeddingConfig) {
  return c.events.find((e) => e.id === c.mainEventId) ?? c.events[c.events.length - 1];
}

/** Lựa chọn "sẽ dự" trong form xác nhận: mỗi địa điểm là một lựa chọn. */
export function rsvpGroups(c: WeddingConfig) {
  return c.venues.map((v) => ({ key: v.id, label: v.rsvpLabel || v.name }));
}

export function memoryImages(c: WeddingConfig) {
  const pairs = Math.max(2, Math.min(c.games.memoryPairs, c.album.length));
  return c.album.slice(0, pairs);
}

export function venueQuery(venue: Venue) {
  return venue.latLng.trim() || `${venue.name}, ${venue.address}`;
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
