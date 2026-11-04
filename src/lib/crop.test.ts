import { describe, expect, it } from "vitest";
import { clampPan, fitFrame, minScale, outputSize, sourceRect } from "./crop";

describe("cắt ảnh", () => {
  const img = { w: 4000, h: 3000 };
  const frame = fitFrame(3 / 4, 360); // 270×360

  it("khung vừa ô và đúng tỉ lệ", () => {
    expect(frame).toEqual({ w: 270, h: 360 });
    expect(fitFrame(16 / 9, 360)).toEqual({ w: 360, h: 203 });
  });

  it("cover phủ kín khung, contain thấy trọn ảnh", () => {
    expect(minScale(img, frame, "cover")).toBeCloseTo(0.12); // 360/3000
    expect(minScale(img, frame, "contain")).toBeCloseTo(0.0675); // 270/4000
  });

  it("không kéo ảnh ra khỏi khung, ảnh nhỏ hơn khung thì căn giữa", () => {
    const s = minScale(img, frame, "cover");
    expect(clampPan(img, frame, s, 50, 50)).toEqual({ x: 0, y: 0 });
    const p = clampPan(img, frame, s, -9999, 0);
    expect(p.x).toBeCloseTo(frame.w - img.w * s);
    const c = minScale(img, frame, "contain");
    expect(clampPan(img, frame, c, 0, 0).y).toBeCloseTo((frame.h - img.h * c) / 2);
  });

  it("vùng cắt trên ảnh gốc khớp khung", () => {
    const s = minScale(img, frame, "cover");
    const r = sourceRect(frame, s, -100 * s, 0);
    expect(r.sx).toBeCloseTo(100);
    expect(r.sh).toBeCloseTo(3000);
    expect(r.sw / r.sh).toBeCloseTo(3 / 4);
  });

  it("ảnh xuất ra đúng tỉ lệ và không phóng to quá ảnh thật", () => {
    expect(outputSize(3 / 4, 1600, 2250)).toEqual({ w: 1200, h: 1600 });
    expect(outputSize(3 / 4, 1600, 600)).toEqual({ w: 600, h: 800 });
    expect(outputSize(16 / 9, 2000, 4000)).toEqual({ w: 2000, h: 1125 });
  });
});
