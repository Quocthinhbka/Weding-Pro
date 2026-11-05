// Cấu hình trò chơi dùng được cả ở trình duyệt. Thời gian mỗi câu đố và số cặp lật hình
// chỉnh trong trang /admin/cau-hinh; câu đố nằm ở quiz.ts (chỉ máy chủ).

/** Thời gian tối thiểu cho mỗi câu đố (chống gửi bài tự động). */
export const quizMinMsPerQuestion = 800;
/** Thời gian tối thiểu cho mỗi cặp thẻ lật hình (chống gian lận). */
export const memoryMinMsPerPair = 1000;

export const gamesList = [
  { id: "wheel", icon: "🎡", title: "Vòng quay may mắn", subtitle: "Quay trúng quà, mỗi ngày +1 lượt.", text: "Mỗi ngày +1 lượt quay" },
  { id: "quiz", icon: "💡", title: "Đố vui về dâu rể", subtitle: "", text: "Đúng 8/10 câu: +1 lượt quay" },
  { id: "memory", icon: "🃏", title: "Lật hình ghép cặp", subtitle: "Ghép hết các cặp ảnh trước khi hết giờ.", text: "3 level · xong mỗi level +1 lượt" },
] as const;
export type GameId = (typeof gamesList)[number]["id"];

/** Tối đa số lượt quay dồn lại (mỗi ngày tặng thêm 1 lượt). */
export const MAX_SPIN_CREDITS = 3;
/** Đố vui: đúng từ chừng này câu trở lên được tặng thêm 1 lượt quay (nhận một lần duy nhất). */
export const QUIZ_BONUS_SCORE = 8;

/** Các level trò lật hình: số cặp, bàn chơi `cols` cột × `rows` hàng (ngang/dọc) và thời gian tối đa `seconds` (đếm ngược). */
export const MEMORY_LEVELS = [
  { level: 1, pairs: 6, cols: 4, rows: 3, seconds: 45 },
  { level: 2, pairs: 8, cols: 4, rows: 4, seconds: 60 },
  { level: 3, pairs: 10, cols: 4, rows: 5, seconds: 75 },
] as const;
/** Chờ thêm chừng này giây (trễ mạng) khi máy chủ kiểm tra thời gian hoàn thành. */
export const MEMORY_GRACE_SECONDS = 5;
export const memoryLevel = (n: number) => MEMORY_LEVELS.find((l) => l.level === n);
