import { z } from "zod";
import { BANK_APPS } from "@/content/banks";
import { MAX_ALBUM, MAX_STORY, SECTION_LABELS, type SectionKey } from "@/content/wedding";

// Kiểm tra dữ liệu cấu hình gửi từ trang quản trị trước khi lưu.

const text = (max: number, label: string) => z.string().trim().max(max, `${label} tối đa ${max} ký tự`);
const required = (max: number, label: string) => text(max, label).min(1, `Vui lòng nhập ${label.toLowerCase()}`);

/** Chỉ chấp nhận đường dẫn nội bộ: ảnh có sẵn trong /images, /audio hoặc file đã tải lên /api/media. */
const mediaPath = z
  .string()
  .trim()
  .regex(/^\/(images|audio|api\/media)\/[A-Za-z0-9._-]+$/, "Đường dẫn ảnh/nhạc không hợp lệ");
const optionalMedia = z.union([z.literal(""), mediaPath]);

const person = (label: string) =>
  z.object({ name: required(40, `Tên ${label}`), born: text(20, "Năm sinh"), photo: mediaPath });

const family = z.object({
  label: required(30, "Tên bên gia đình"),
  members: z.array(z.object({ role: required(20, "Vai trò"), name: required(60, "Tên thành viên") })).max(8),
});

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Giờ phải có dạng HH:mm, VD 18:00");
const id = z.string().regex(/^[a-z0-9-]{1,40}$/);

export const configSchema = z
  .object({
    groom: person("chú rể"),
    bride: person("cô dâu"),
    families: z.object({ trai: family, gai: family }),
    date: z.object({
      iso: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày cưới không hợp lệ"),
      lunar: text(60, "Ngày âm lịch"),
      countdownTime: time,
    }),
    venues: z
      .array(
        z.object({
          id,
          name: required(80, "Tên địa điểm"),
          address: required(160, "Địa chỉ"),
          latLng: text(60, "Toạ độ"),
          rsvpLabel: text(60, "Tên lựa chọn khi xác nhận"),
        }),
      )
      .min(1, "Cần ít nhất 1 địa điểm")
      .max(6),
    events: z
      .array(z.object({ id, title: required(60, "Tên sự kiện"), time, venueId: z.union([z.literal(""), id]) }))
      .min(1, "Cần ít nhất 1 sự kiện")
      .max(12),
    sides: z.object(
      Object.fromEntries(
        (["groom", "bride"] as const).map((k) => [k, z.object({ eventId: id, title: required(40, "Tên sự kiện ở thẻ mời"), feastEventId: id })]),
      ) as Record<"groom" | "bride", z.ZodObject<{ eventId: z.ZodString; title: z.ZodString; feastEventId: z.ZodString }>>,
    ),
    texts: z.object({
      invitation: required(300, "Lời mời"),
      thankYou: required(300, "Lời cảm ơn"),
      guestFallback: required(40, "Lời chào khi không có tên khách"),
    }),
    heroImage: mediaPath,
    music: z.object({ src: optionalMedia, title: text(80, "Tên bài hát"), artist: text(80, "Ca sĩ") }),
    loveStory: z
      .array(z.object({ title: required(60, "Tiêu đề kỷ niệm"), text: text(400, "Nội dung kỷ niệm"), image: mediaPath }))
      .max(MAX_STORY, `Tối đa ${MAX_STORY} kỷ niệm để vừa trong một sector`),
    album: z.array(mediaPath).max(MAX_ALBUM, `Album tối đa ${MAX_ALBUM} ảnh`),
    gifts: z
      .array(
        z.object({
          title: required(40, "Tiêu đề hộp mừng"),
          bank: text(60, "Tên ngân hàng"),
          accountNumber: text(30, "Số tài khoản"),
          accountName: text(60, "Chủ tài khoản"),
          qr: optionalMedia,
          bankApp: z.string().max(20).refine((v) => v === "" || BANK_APPS.some((b) => b.id === v), "Ngân hàng chưa hợp lệ"),
        }),
      )
      .max(4),
    sections: z.object(
      Object.fromEntries(Object.keys(SECTION_LABELS).map((k) => [k, z.boolean()])) as Record<SectionKey, z.ZodBoolean>,
    ),
    games: z.object({
      quizSeconds: z.number().int().min(5, "Mỗi câu đố tối thiểu 5 giây").max(120),
      memoryPairs: z.number().int().min(2).max(12),
    }),
  })
  .superRefine((c, ctx) => {
    const venueIds = new Set(c.venues.map((v) => v.id));
    if (venueIds.size !== c.venues.length) ctx.addIssue({ code: "custom", message: "Mã địa điểm bị trùng" });
    for (const e of c.events) {
      if (e.venueId && !venueIds.has(e.venueId)) ctx.addIssue({ code: "custom", message: `Sự kiện "${e.title}" chưa chọn địa điểm hợp lệ` });
    }
    const eventIds = new Set(c.events.map((e) => e.id));
    if (eventIds.size !== c.events.length) ctx.addIssue({ code: "custom", message: "Mã sự kiện bị trùng" });
    for (const [k, label] of [["groom", "nhà trai"], ["bride", "nhà gái"]] as const) {
      if (!eventIds.has(c.sides[k].eventId)) ctx.addIssue({ code: "custom", message: `Vui lòng chọn sự kiện chính cho thiệp ${label}` });
      if (!eventIds.has(c.sides[k].feastEventId)) ctx.addIssue({ code: "custom", message: `Vui lòng chọn buổi tiệc thân mật cho thiệp ${label}` });
    }
    if (c.sections.games && c.album.length < 2) {
      ctx.addIssue({ code: "custom", message: "Trò lật hình cần ít nhất 2 ảnh trong album" });
    }
  });

export const quizSchema = z
  .array(
    z
      .object({
        question: required(200, "Câu hỏi"),
        options: z.array(required(100, "Đáp án")).min(2, "Mỗi câu cần ít nhất 2 đáp án").max(6),
        answer: z.number().int().min(0),
      })
      .refine((q) => q.answer < q.options.length, { message: "Có câu hỏi chưa chọn đáp án đúng" }),
  )
  .min(1, "Cần ít nhất 1 câu đố")
  .max(30);
