import { describe, expect, it } from "vitest";
import { collageRows, packCollage } from "./collage";

describe("xếp ảnh khít giữ tỉ lệ", () => {
  const ratios = [1.5, 0.75, 1, 1.78, 0.56, 1.33, 1, 0.8, 1.2, 1.5, 0.67, 1];

  it("mỗi ảnh giữ đúng tỉ lệ, các hàng cùng bề ngang, tổng chiều cao đúng H", () => {
    for (const [H, gap, rows] of [[600, 6, 3], [430, 6, 3], [800, 4, 4], [300, 6, 2]] as const) {
      const c = packCollage(ratios, H, gap, rows);
      for (const row of c.rows) {
        for (const t of row.tiles) expect(t.w / t.h).toBeCloseTo(ratios[t.i], 6);
        const width = row.tiles.reduce((a, t) => a + t.w, 0) + (row.tiles.length - 1) * gap;
        expect(width).toBeCloseTo(c.W, 6);
      }
      const height = c.rows.reduce((a, r) => a + r.h, 0) + (c.rows.length - 1) * gap;
      expect(height).toBeCloseTo(H, 6);
    }
  });

  it("mọi ảnh có mặt đúng một lần, theo cỡ khác nhau giữa các hàng", () => {
    const c = packCollage(ratios, 600, 6, 3);
    expect(c.rows.flatMap((r) => r.tiles.map((t) => t.i)).sort((a, b) => a - b)).toEqual(ratios.map((_, i) => i));
    expect(new Set(c.rows.map((r) => Math.round(r.h))).size).toBeGreaterThan(1);
  });

  it("ít ảnh thì giảm số hàng; số hàng theo chiều cao", () => {
    expect(packCollage([1, 1.5], 600, 6, 4).rows).toHaveLength(2);
    expect(packCollage([1.2], 600, 6, 3).rows[0].tiles).toHaveLength(1);
    expect([300, 430, 600, 900].map((h) => collageRows(h, 20))).toEqual([2, 3, 4, 4]);
    expect(collageRows(600, 3)).toBe(3);
  });
});
