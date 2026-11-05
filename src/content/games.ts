// Cấu hình trò chơi dùng được cả ở trình duyệt. Thời gian mỗi câu đố và số cặp lật hình
// chỉnh trong trang /admin/cau-hinh; câu đố nằm ở quiz.ts (chỉ máy chủ).

/** Thời gian tối thiểu cho mỗi câu đố (chống gửi bài tự động). */
export const quizMinMsPerQuestion = 800;
/** Thời gian tối thiểu cho mỗi cặp thẻ lật hình (chống gian lận). */
export const memoryMinMsPerPair = 1000;

export const gamesList = [
  { id: "wheel", icon: "🎡", title: "Vòng quay may mắn", subtitle: "Mỗi ngày bạn được tặng thêm 1 lượt quay. Chúc bạn may mắn!", text: "Mỗi ngày +1 lượt quay (dồn tối đa 3), xem lại lịch sử quay." },
  { id: "quiz", icon: "💡", title: "Đố vui về dâu rể", subtitle: "", text: "Đúng từ 8 câu tặng thêm 1 lượt quay. Top 3 nhận quà." },
  { id: "memory", icon: "🃏", title: "Lật hình ghép cặp", subtitle: "Tìm các cặp ảnh giống nhau nhanh nhất có thể!", text: "3 level: 6, 8 và 10 cặp. Ai nhanh nhất sẽ có quà!" },
] as const;
export type GameId = (typeof gamesList)[number]["id"];

/** Tối đa số lượt quay dồn lại (mỗi ngày tặng thêm 1 lượt). */
export const MAX_SPIN_CREDITS = 3;
/** Đố vui: đúng từ chừng này câu trở lên được tặng thêm 1 lượt quay (nhận một lần duy nhất). */
export const QUIZ_BONUS_SCORE = 8;

/** Các level trò lật hình: số cặp và bàn chơi `cols` cột × `rows` hàng (ngang/dọc). */
export const MEMORY_LEVELS = [
  { level: 1, pairs: 6, cols: 4, rows: 3 },
  { level: 2, pairs: 8, cols: 4, rows: 4 },
  { level: 3, pairs: 10, cols: 4, rows: 5 },
] as const;
export type MemoryLevel = (typeof MEMORY_LEVELS)[number]["level"];
export const memoryLevel = (n: number) => MEMORY_LEVELS.find((l) => l.level === n);
