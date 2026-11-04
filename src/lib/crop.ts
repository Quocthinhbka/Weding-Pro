// Tính toán cho hộp thoại cắt ảnh (thuần, có test). Ảnh gốc được vẽ với tỉ lệ `scale`,
// góc trên trái đặt tại (x, y) tính theo điểm ảnh của khung cắt.

export type Box = { w: number; h: number };

/** Khung cắt theo tỉ lệ w/h, vừa trong ô vuông `max`. */
export function fitFrame(aspect: number, max: number): Box {
  return aspect >= 1 ? { w: max, h: Math.round(max / aspect) } : { w: Math.round(max * aspect), h: max };
}

/** Tỉ lệ nhỏ nhất: `cover` = ảnh luôn phủ kín khung; `contain` = cho thấy trọn ảnh (chừa nền trắng). */
export function minScale(img: Box, frame: Box, mode: "cover" | "contain") {
  const fit = mode === "cover" ? Math.max : Math.min;
  return fit(frame.w / img.w, frame.h / img.h);
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Giữ ảnh không trượt ra khỏi khung; chiều nào ảnh nhỏ hơn khung thì căn giữa. */
export function clampPan(img: Box, frame: Box, scale: number, x: number, y: number) {
  const w = img.w * scale;
  const h = img.h * scale;
  return {
    x: w >= frame.w ? clamp(x, frame.w - w, 0) : (frame.w - w) / 2,
    y: h >= frame.h ? clamp(y, frame.h - h, 0) : (frame.h - h) / 2,
  };
}

/** Vùng của ảnh gốc đang nằm trong khung (điểm ảnh gốc). */
export function sourceRect(frame: Box, scale: number, x: number, y: number) {
  return { sx: -x / scale, sy: -y / scale, sw: frame.w / scale, sh: frame.h / scale };
}

/** Kích thước ảnh xuất ra: cạnh dài tối đa `outSide`, nhưng không phóng to quá độ phân giải thật của vùng cắt. */
export function outputSize(aspect: number, outSide: number, sourceW: number): Box {
  const targetW = aspect >= 1 ? outSide : outSide * aspect;
  const w = Math.max(1, Math.round(targetW * Math.min(1, sourceW / targetW)));
  return { w, h: Math.max(1, Math.round(w / aspect)) };
}
