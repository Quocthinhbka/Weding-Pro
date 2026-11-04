// Logic thuần của trò chơi (không truy cập cơ sở dữ liệu), có test kèm theo.

export type PrizeRow = {
  id: number;
  label: string;
  color: string;
  weight: number;
  stock: number | null;
  is_win: number;
};

/** Chọn giải theo trọng số, bỏ qua giải đã hết. rand trong khoảng [0, 1). */
export function pickPrize<T extends Pick<PrizeRow, "weight" | "stock">>(prizes: T[], rand: number): T | null {
  const available = prizes.filter((p) => p.weight > 0 && (p.stock === null || p.stock > 0));
  const total = available.reduce((sum, p) => sum + p.weight, 0);
  if (total === 0) return null;
  let r = rand * total;
  for (const p of available) {
    if (r < p.weight) return p;
    r -= p.weight;
  }
  return available[available.length - 1];
}

export function scoreQuiz(answers: (number | null)[], key: number[]) {
  return key.reduce((score, correct, i) => score + (answers[i] === correct ? 1 : 0), 0);
}

/** Chuẩn hoá số điện thoại Việt Nam về dạng 0xxxxxxxxx. Trả null nếu không hợp lệ. */
export function normalizePhone(input: string): string | null {
  let digits = input.replace(/[^\d+]/g, "");
  if (digits.startsWith("+84")) digits = "0" + digits.slice(3);
  else if (digits.startsWith("84") && digits.length === 11) digits = "0" + digits.slice(2);
  digits = digits.replace(/\D/g, "");
  return /^0\d{9}$/.test(digits) ? digits : null;
}

export function formatLucky(n: number) {
  return String(n).padStart(3, "0");
}
