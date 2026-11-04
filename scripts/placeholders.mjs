// Tạo ảnh tạm (SVG) cho thiệp: chạy `node scripts/placeholders.mjs`.
// Khi có ảnh thật, đặt file vào public/images rồi sửa đường dẫn trong src/content/wedding.ts.
import fs from "node:fs";
import path from "node:path";

const out = path.join(import.meta.dirname, "..", "public", "images");
fs.mkdirSync(out, { recursive: true });

const palettes = [
  ["#E9DFC9", "#C9D3A8"],
  ["#F3E3D3", "#E7B9AE"],
  ["#EEE6D2", "#F6D88E"],
  ["#E4E9D6", "#A9B98A"],
  ["#F4EADB", "#D8C3A0"],
  ["#EADFD6", "#C9877A"],
  ["#EFE8D8", "#B8C49A"],
  ["#F6EEDC", "#F2C14E"],
  ["#E6E1D3", "#9FAF83"],
];

function daisy(cx, cy, r, opacity = 1) {
  const petals = Array.from({ length: 14 }, (_, i) =>
    `<ellipse cx="${cx}" cy="${cy - r * 0.55}" rx="${r * 0.16}" ry="${r * 0.45}" transform="rotate(${(360 / 14) * i} ${cx} ${cy})"/>`,
  ).join("");
  return `<g opacity="${opacity}"><g fill="#fff" stroke="#e4d8c2" stroke-width="${r * 0.02}">${petals}</g><circle cx="${cx}" cy="${cy}" r="${r * 0.26}" fill="#F2C14E" stroke="#d9a43a" stroke-width="${r * 0.03}"/></g>`;
}

function photo(file, w, h, label, [bg, accent], sub = "Ảnh tạm – thay bằng ảnh thật", labelY = 0.5) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${bg}"/><stop offset="1" stop-color="${accent}"/></linearGradient></defs>
  <rect width="${w}" height="${h}" fill="url(#g)"/>
  ${daisy(w * 0.22, h * 0.25, Math.min(w, h) * 0.32, 0.55)}
  ${daisy(w * 0.8, h * 0.78, Math.min(w, h) * 0.42, 0.45)}
  ${daisy(w * 0.5, h * 0.5, Math.min(w, h) * 0.2, 0.9)}
  <text x="${w / 2}" y="${h * labelY + Math.min(w, h) * 0.22}" text-anchor="middle" font-family="Georgia, serif" font-size="${Math.min(w, h) * 0.075}" fill="#3F3326">${label}</text>
  <text x="${w / 2}" y="${h * labelY + Math.min(w, h) * 0.3}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${Math.min(w, h) * 0.035}" fill="#6e5f4d">${sub}</text>
</svg>`;
  fs.writeFileSync(path.join(out, file), svg);
}

function qr(file, label) {
  // Ô vuông giả lập mã QR – thay bằng ảnh QR thật xuất từ ứng dụng ngân hàng.
  const n = 21;
  let cells = "";
  let seed = label.length * 7919;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      const finder = (x < 7 && y < 7) || (x > 13 && y < 7) || (x < 7 && y > 13);
      if (finder) continue;
      if (rand() > 0.55) cells += `<rect x="${x * 10}" y="${y * 10}" width="10" height="10"/>`;
    }
  const finder = (x, y) =>
    `<rect x="${x}" y="${y}" width="70" height="70" fill="#3F3326"/><rect x="${x + 10}" y="${y + 10}" width="50" height="50" fill="#fff"/><rect x="${x + 20}" y="${y + 20}" width="30" height="30" fill="#3F3326"/>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-10 -10 230 230" width="460" height="460">
  <rect x="-10" y="-10" width="230" height="230" fill="#fff"/>
  <g fill="#3F3326" opacity="0.25">${cells}</g>
  ${finder(0, 0)}${finder(140, 0)}${finder(0, 140)}
  <rect x="45" y="92" width="120" height="26" rx="6" fill="#fff"/>
  <text x="105" y="110" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#3F3326">${label}</text>
</svg>`;
  fs.writeFileSync(path.join(out, file), svg);
}

// Chữ của ảnh bìa đặt cao lên để không chồng với tên cô dâu chú rể.
photo("hero.svg", 900, 1350, "Ảnh bìa", ["#E9DFC9", "#9FAF83"], "Ảnh tạm – thay bằng ảnh thật", 0.08);
photo("groom.svg", 600, 800, "Chú rể", ["#EEE6D2", "#A9B98A"]);
photo("bride.svg", 600, 800, "Cô dâu", ["#F3E3D3", "#E7B9AE"]);
for (let i = 1; i <= 4; i++) photo(`story-${i}.svg`, 600, 600, `Kỷ niệm ${i}`, palettes[i]);
palettes.forEach((p, i) => photo(`album-${i + 1}.svg`, 800, 800, `Ảnh cưới ${i + 1}`, p));
qr("qr-groom.svg", "QR chú rể (tạm)");
qr("qr-bride.svg", "QR cô dâu (tạm)");
console.log("Đã tạo ảnh tạm trong", out);
