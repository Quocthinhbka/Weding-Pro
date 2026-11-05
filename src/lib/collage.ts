// Xếp ảnh thành một mảng khít giữ nguyên tỉ lệ từng ảnh (thuần, có test).
// Ảnh chia vào R hàng; mỗi hàng có cùng bề ngang W nên cả mảng là một hình chữ nhật không kẽ hở.
// Hàng có tổng tỉ lệ (rộng/cao) lớn thì thấp hơn, hàng ít ảnh dẹt thì cao hơn → ảnh to nhỏ khác nhau.

type Tile = { i: number; w: number; h: number };
type CollageRow = { h: number; tiles: Tile[] };
export type Collage = { W: number; H: number; rows: CollageRow[] };

// Tỉ trọng tổng tỉ lệ ảnh của từng hàng (hàng nào lớn hơn thì ảnh nhỏ hơn); lặp lại nếu cần.
const WEIGHTS = [1.25, 0.8, 1.1, 0.85, 1.2, 0.9];

/** Số hàng hợp lý cho chiều cao H: ảnh cao khoảng 150px. */
export function collageRows(H: number, count: number) {
  return Math.max(1, Math.min(count, Math.max(2, Math.min(4, Math.round(H / 170)))));
}

/**
 * Chia `ratios` (rộng/cao của từng ảnh, theo thứ tự album) vào `rows` hàng rồi tính kích thước (px) sao cho
 * mảng cao đúng H, các ảnh cách nhau `gap`, và mỗi ảnh có đúng tỉ lệ ban đầu.
 */
export function packCollage(ratios: number[], H: number, gap: number, rows: number): Collage {
  const n = ratios.length;
  const R = Math.max(1, Math.min(rows, n));
  const target = Array.from({ length: R }, (_, r) => WEIGHTS[r % WEIGHTS.length]);
  const assigned: number[][] = Array.from({ length: R }, () => []);
  const sum = Array<number>(R).fill(0);
  ratios.forEach((a, i) => {
    let best = 0;
    for (let r = 1; r < R; r++) if (sum[r] / target[r] < sum[best] / target[best]) best = r;
    assigned[best].push(i);
    sum[best] += a;
  });
  // Hàng r cao h_r = (W − (n_r−1)·gap) / S_r; tổng chiều cao = H ⇒ giải ra W.
  let inv = 0;
  let extra = 0;
  assigned.forEach((idx, r) => {
    inv += 1 / sum[r];
    extra += ((idx.length - 1) * gap) / sum[r];
  });
  const W = (H - (R - 1) * gap + extra) / inv;
  return {
    W,
    H,
    rows: assigned.map((idx, r) => {
      const h = (W - (idx.length - 1) * gap) / sum[r];
      return { h, tiles: idx.map((i) => ({ i, w: ratios[i] * h, h })) };
    }),
  };
}
