import "server-only";

// Chỉ dùng trên máy chủ: đáp án đố vui và tỉ lệ trúng giải không được gửi xuống trình duyệt.
// Đây là giá trị khởi tạo lần đầu: giải vòng quay chỉnh ở /admin/tro-choi, câu đố chỉnh ở /admin/cau-hinh.

export type PrizeSeed = {
  label: string;
  color: string;
  weight: number; // trọng số trúng, càng lớn càng dễ trúng
  stock: number | null; // null = không giới hạn
  isWin: boolean; // false = ô "chúc may mắn"
};

export const wheelPrizes: PrizeSeed[] = [
  { label: "Lì xì 100K", color: "#F2C14E", weight: 3, stock: 5, isWin: true },
  { label: "Chúc may mắn", color: "#FFFDF7", weight: 30, stock: null, isWin: false },
  { label: "Kẹo cưới", color: "#C9D3A8", weight: 25, stock: 60, isWin: true },
  { label: "Lì xì 50K", color: "#F6D88E", weight: 8, stock: 15, isWin: true },
  { label: "Chúc may mắn", color: "#FFFDF7", weight: 30, stock: null, isWin: false },
  { label: "Ảnh cùng dâu rể", color: "#E7B9AE", weight: 15, stock: null, isWin: true },
];

export type QuizQuestion = {
  question: string;
  options: string[];
  answer: number; // vị trí đáp án đúng trong options (bắt đầu từ 0)
};

// Câu hỏi mặc định dựa trên chính tấm thiệp.
// Nên thay bằng câu hỏi riêng về hai bạn.
export const defaultQuiz: QuizQuestion[] = [
  {
    question: "Ngày cưới của Quốc Thịnh & Minh Trang là ngày nào?",
    options: ["22/11/2026", "29/11/2026", "06/12/2026", "29/12/2026"],
    answer: 1,
  },
  {
    question: "Ngày cưới tức là ngày nào theo âm lịch?",
    options: ["12/10 Bính Ngọ", "21/11 Bính Ngọ", "21/10 Bính Ngọ", "01/10 Bính Ngọ"],
    answer: 2,
  },
  {
    question: "Ngày cưới rơi vào thứ mấy?",
    options: ["Thứ Sáu", "Thứ Bảy", "Chủ Nhật", "Thứ Hai"],
    answer: 2,
  },
  {
    question: "Lễ Vu Quy được tổ chức ở đâu?",
    options: ["Hà Nội", "Ninh Bình", "Hải Phòng", "Thanh Hóa"],
    answer: 1,
  },
  {
    question: "Lễ Vu Quy bắt đầu lúc mấy giờ?",
    options: ["10:00", "11:30", "13:00", "15:00"],
    answer: 2,
  },
  {
    question: "Bữa cơm thân mật tại nhà gái bắt đầu lúc mấy giờ?",
    options: ["09:00", "10:00", "11:00", "12:00"],
    answer: 1,
  },
  {
    question: "Tiệc cưới tại Hà Nội diễn ra ở đâu?",
    options: [
      "Khách sạn A15 – 55 Trần Hòa",
      "Một nhà hàng ven Hồ Tây",
      "Tư gia nhà trai",
      "Cung văn hóa trung tâm",
    ],
    answer: 0,
  },
  {
    question: "Lễ Thành Hôn bắt đầu lúc mấy giờ?",
    options: ["17:00", "17:30", "18:00", "19:00"],
    answer: 2,
  },
  {
    question: "Loài hoa nào là “linh vật” của tấm thiệp này?",
    options: ["Hoa hồng", "Hoa cúc", "Hoa sen", "Hoa ly"],
    answer: 1,
  },
  {
    question: "Năm 2026 là năm con gì?",
    options: ["Con Rắn", "Con Ngựa", "Con Dê", "Con Rồng"],
    answer: 1,
  },
];
