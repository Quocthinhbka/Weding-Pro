// Cấu hình trò chơi dùng được cả ở trình duyệt. Thời gian mỗi câu đố và số cặp lật hình
// chỉnh trong trang /admin/cau-hinh; câu đố nằm ở quiz.ts (chỉ máy chủ).

/** Thời gian tối thiểu cho mỗi câu đố (chống gửi bài tự động). */
export const quizMinMsPerQuestion = 800;
/** Thời gian tối thiểu cho mỗi cặp thẻ lật hình (chống gian lận). */
export const memoryMinMsPerPair = 1000;

export const gamesList = [
  { id: "wheel", icon: "🎡", title: "Vòng quay may mắn", subtitle: "Mỗi khách đã xác nhận tham dự có 1 lượt quay. Chúc bạn may mắn!", text: "Xác nhận tham dự để nhận 1 lượt quay trúng quà." },
  { id: "quiz", icon: "💡", title: "Đố vui về dâu rể", subtitle: "", text: "Top 3 điểm cao nhất nhận quà tại tiệc." },
  { id: "memory", icon: "🃏", title: "Lật hình ghép cặp", subtitle: "Tìm các cặp ảnh giống nhau nhanh nhất có thể!", text: "Ai nhanh tay nhất sẽ có quà!" },
] as const;
export type GameId = (typeof gamesList)[number]["id"];
