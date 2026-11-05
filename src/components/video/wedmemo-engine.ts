/* eslint-disable */
// @ts-nocheck
// Chuyển từ dự án WedMemo (ghi video lời chúc). Logic giữ nguyên; khác biệt: gắn vào một phần tử gốc của thiệp
// thay vì cả trang, gọi máy chủ ở /wedmemo/api, lấy tên và ngày từ cấu hình thiệp, và có hàm destroy() để dọn dẹp.
// Khung (tên, ngày) được vẽ lên canvas nên nằm luôn trong video đã ghi.

export type WedMemoConfig = { groom: string; bride: string; date: string; title: string; frame: string; max_minutes: number };

export function startWedMemo(root: HTMLElement, opts: { kiosk: boolean; cfg: WedMemoConfig }) {
const $ = s => root.querySelector(s);
const BASE = '/wedmemo/';   // máy chủ nhận và phát clip ở /wedmemo/api và /wedmemo/data
const dead = { v: false };
const offs = [];   // việc dọn dẹp khi gỡ khỏi trang
const listen = (t, ev, fn, o) => { t.addEventListener(ev, fn, o); offs.push(() => t.removeEventListener(ev, fn, o)); };
const KIOSK = opts.kiosk;
const C = 238.76;   // chu vi vòng tiến trình (r=38)
// MP4 (H.264/AAC) phát được trên mọi máy kể cả iPhone; WebM chỉ dùng khi trình duyệt không ghi được MP4 (Firefox)
const MIME = ['video/mp4;codecs=avc1.42E01E,mp4a.40.2', 'video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm']
  .find(t => window.MediaRecorder && MediaRecorder.isTypeSupported(t)) || '';
const HINTS = ['Bạn quen cô dâu chú rể thế nào?', 'Kể một kỷ niệm vui với hai bạn nhé!', 'Lời khuyên cho cuộc sống hôn nhân?',
  'Chúc hai bạn điều gì cho tương lai?', 'Cứ nói tự nhiên như đang trò chuyện 😊'];
let CFG = opts.cfg;
// Canvas cần đúng tên font mà next/font đã nạp: đọc từ chính trang.
const probe = cls => { const e = document.createElement('span'); e.className = cls; e.style.cssText = 'position:absolute;visibility:hidden'; root.append(e); const f = getComputedStyle(e).fontFamily; e.remove(); return f; };
const SANS = probe(''), SCRIPT = probe('font-script');

const cv = $('#cv'), ctx = cv.getContext('2d'), ov = document.createElement('canvas'), pv = $('#pv');
const video = Object.assign(document.createElement('video'), { muted: true, playsInline: true, autoplay: true });
video.setAttribute('playsinline', '');
video.style.cssText = 'position:fixed;left:0;top:0;width:2px;height:2px;opacity:0;pointer-events:none';
root.append(video);   // iPhone chỉ cập nhật khung hình khi video nằm trong trang

let cam = null, facing = 'user', dur = 30, priv = false, state = 'idle', drawing = false;
let rec, chunks, t0, secs, thumbs, tickIv, pending, key = null, list = [], cur = -1, countIv, discard = false;

const mmss = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const when = ts => new Date(ts * 1000).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' });
const rid = () => Array.from(crypto.getRandomValues(new Uint8Array(16)), b => b.toString(16).padStart(2, '0')).join('');

/* ---------- Khung hình ---------- */
// Mỗi khung = bố cục + bảng màu. Không để khung chìm vào video: chữ luôn nằm trên nền đặc/bán đặc,
// đường viền có lớp lót tối bên dưới, hoa văn có bóng đổ → nổi rõ trên cả nền sáng lẫn nền tối.
const THEMES = [
  { id: 'gold', name: 'Vàng cổ điển', layout: 'classic', line: '#e2c08d', amp: '#f3b6c0', leaf: '#9cc5a1', ink: '#fff', panel: 'rgba(22,14,18,.74)' },
  { id: 'burgundy', name: 'Đỏ rượu vang', layout: 'classic', line: '#ecc0a8', amp: '#ffd0c6', leaf: '#c9a27e', ink: '#fff4ef', panel: 'rgba(96,18,38,.85)' },
  { id: 'blush', name: 'Hồng pastel', layout: 'polaroid', paper: '#f9dfe5', line: '#c9708a', amp: '#d9536f', ink: '#7a2940', title: '#b05a73' },
  { id: 'ivory', name: 'Trắng tinh khôi', layout: 'polaroid', paper: '#fbf7ee', line: '#c8a46a', amp: '#c8a46a', ink: '#2b2420', title: '#94733f' },
  { id: 'navy', name: 'Xanh navy', layout: 'band', band: '#1c2a4a', line: '#e2c08d', amp: '#e2c08d', ink: '#fff' },
  { id: 'sunset', name: 'Hoàng hôn', layout: 'band', band: '#f0606a', band2: '#ffab40', line: '#fff3e0', amp: '#6d1426', ink: '#fff' },
  { id: 'red', name: 'Đỏ song hỷ', layout: 'polaroid', paper: '#b3121f', line: '#f5c542', amp: '#f5c542', ink: '#ffe9a8', title: '#f5c542', hy: true },
  { id: 'sage', name: 'Xanh lá sage', layout: 'classic', big: true, line: '#eef3e8', amp: '#d9727c', leaf: '#6f9a6a', ink: '#33502f', panel: 'rgba(247,250,243,.9)', title: '#4a6b45' },
  { id: 'lavender', name: 'Tím lavender', layout: 'plaque', line: '#cdb8f0', amp: '#b8478c', ink: '#3e2a63', panel: 'rgba(249,245,255,.92)', title: '#7a5fae' },
  { id: 'noir', name: 'Đen champagne', layout: 'luxe', paper: '#0d0d0f', line: '#d9c3a0', amp: '#d9c3a0', ink: '#f3e6cf' },
];
let theme = THEMES[0];

const rr = (g, x, y, w, h, r) => { g.beginPath(); if (g.roundRect) g.roundRect(x, y, w, h, r); else g.rect(x, y, w, h); };
const track = (g, px) => { if ('letterSpacing' in g) g.letterSpacing = px + 'px'; };
function outline(g, x, y, w, h, r, color, lw, s) {   // viền 2 lớp: lót tối + màu
  rr(g, x, y, w, h, r);
  g.strokeStyle = 'rgba(0,0,0,.45)'; g.lineWidth = lw + 3 * s; g.stroke();
  g.strokeStyle = color; g.lineWidth = lw; g.stroke();
}
function frameHole(g, W, H, side, bot, rad, color) {   // viền đặc, chừa ô video ở giữa
  g.fillStyle = color; g.beginPath(); g.rect(0, 0, W, H);
  if (g.roundRect) g.roundRect(side, side, W - 2 * side, H - side - bot, rad); else g.rect(side, side, W - 2 * side, H - side - bot);
  g.fill('evenodd');
}
function label(g, text, x, y, size, color, spacing, align = 'center') {
  g.font = `600 ${size}px ${SANS}`; g.fillStyle = color; g.textAlign = align;
  track(g, spacing); g.fillText(text, x, y); track(g, 0);
}
function fitNames(g, maxW, size) {   // thu nhỏ chữ tới khi tên vừa chỗ
  const parts = [CFG.groom, ' & ', CFG.bride];
  let w;
  do {
    g.font = `700 ${size}px ${SCRIPT}`;
    w = parts.reduce((a, p) => a + g.measureText(p).width, 0);
    size *= .94;
  } while (w > maxW && size > 10);
  return { parts, w, font: g.font };
}
function paintNames(g, f, x, y, ink, amp, align = 'center') {
  g.font = f.font; g.textAlign = 'left';
  if (align === 'center') x -= f.w / 2;
  f.parts.forEach((p, i) => { g.fillStyle = i === 1 ? amp : ink; g.fillText(p, x, y); x += g.measureText(p).width; });
}
function pill(g, text, cx, cy, s, fill, color) {
  g.font = `600 ${14 * s}px ${SANS}`; track(g, 4 * s);
  const w = g.measureText(text).width + 40 * s; track(g, 0);
  g.fillStyle = fill; rr(g, cx - w / 2, cy - 17 * s, w, 34 * s, 17 * s); g.fill();
  g.textBaseline = 'middle'; label(g, text, cx, cy + s, 14 * s, color, 4 * s); g.textBaseline = 'alphabetic';
}
function fade(g, W, H, a) {
  const gr = g.createLinearGradient(0, H * .55, 0, H);
  gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, `rgba(0,0,0,${a})`);
  g.fillStyle = gr; g.fillRect(0, H * .55, W, H * .45);
}
function sprig(g, t) {   // nhành hoa lá, toạ độ 120×120
  const leaf = t.leaf || t.line;
  g.strokeStyle = t.line; g.lineWidth = 2.5; g.stroke(new Path2D('M6 114C10 60 40 20 114 6'));
  for (const [d, c] of [['M30 70q14-18 34-12q-10 18-34 12z', t.amp], ['M58 38q16-14 34-6q-12 16-34 6z', t.line],
    ['M14 60q10-6 18 2q-10 6-18-2z', leaf], ['M60 14q6 10-2 18q-6-10 2-18z', leaf]]) { g.fillStyle = c; g.fill(new Path2D(d)); }
  for (const [x, y, r] of [[20, 94, 7], [94, 20, 6]]) {
    g.fillStyle = t.amp; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
    g.fillStyle = '#fff'; g.beginPath(); g.arc(x, y, r * .42, 0, 7); g.fill();
  }
}
function corners(g, W, H, k, t, which = [0, 1, 2, 3]) {
  const at = [[0, 0, 1, 1], [W, 0, -1, 1], [0, H, 1, -1], [W, H, -1, -1]];
  g.save(); g.shadowColor = 'rgba(0,0,0,.55)'; g.shadowBlur = 6;
  for (const i of which) { const [x, y, sx, sy] = at[i]; g.save(); g.translate(x, y); g.scale(sx * k, sy * k); sprig(g, t); g.restore(); }
  g.restore();
}
function brackets(g, x0, y0, x1, y1, s, color) {   // góc kiểu art-deco
  const m = 30 * s, L = 70 * s, i = 10 * s;
  for (const [x, y, sx, sy] of [[x0 + m, y0 + m, 1, 1], [x1 - m, y0 + m, -1, 1], [x0 + m, y1 - m, 1, -1], [x1 - m, y1 - m, -1, -1]]) {
    g.beginPath();
    g.moveTo(x, y + sy * L); g.lineTo(x, y); g.lineTo(x + sx * L, y);
    g.moveTo(x + sx * i, y + sy * (L - 2 * i)); g.lineTo(x + sx * i, y + sy * i); g.lineTo(x + sx * (L - 2 * i), y + sy * i);
    g.strokeStyle = 'rgba(0,0,0,.45)'; g.lineWidth = 6 * s; g.stroke();
    g.strokeStyle = color; g.lineWidth = 3 * s; g.stroke();
  }
}

const LAYOUTS = {
  classic(g, W, H, s, t) {   // viền đôi + hoa góc + bảng tên
    const tc = t.title || t.line;
    fade(g, W, H, .4);
    outline(g, 16 * s, 16 * s, W - 32 * s, H - 32 * s, 14 * s, t.line, 3 * s, s);
    outline(g, 25 * s, 25 * s, W - 50 * s, H - 50 * s, 10 * s, t.line, 1.2 * s, s);
    if (t.big) corners(g, W, H, 2 * s, t, [0, 3]); else corners(g, W, H, 1.2 * s, t);
    pill(g, CFG.title.toUpperCase(), W / 2, 62 * s, s, t.panel, tc);
    const f = fitNames(g, W - 220 * s, 68 * s), pw = f.w + 90 * s, ph = 128 * s, py = H - 50 * s - ph;
    g.fillStyle = t.panel; rr(g, (W - pw) / 2, py, pw, ph, 22 * s); g.fill();
    g.strokeStyle = tc; g.lineWidth = 1.5 * s; g.stroke();
    paintNames(g, f, W / 2, py + 76 * s, t.ink, t.amp);
    label(g, CFG.date, W / 2, py + 108 * s, 15 * s, tc, 6 * s);
  },
  polaroid(g, W, H, s, t) {   // viền giấy đặc, tên ở mép dưới
    const side = 24 * s, bot = 170 * s, y0 = H - bot, tc = t.title || t.line;
    g.save(); g.shadowColor = 'rgba(0,0,0,.4)'; g.shadowBlur = 14 * s;   // bóng đổ vào trong ô video
    frameHole(g, W, H, side, bot, 12 * s, t.paper); g.restore();
    g.strokeStyle = t.line; g.lineWidth = 2 * s; rr(g, side, side, W - 2 * side, H - side - bot, 12 * s); g.stroke();
    label(g, '— ' + CFG.title.toUpperCase() + ' —', W / 2, y0 + 40 * s, 14 * s, tc, 4 * s);
    paintNames(g, fitNames(g, W - 120 * s, 64 * s), W / 2, y0 + 108 * s, t.ink, t.amp);
    label(g, CFG.date, W / 2, y0 + 145 * s, 15 * s, tc, 6 * s);
    if (t.hy) {   // chữ song hỷ trong huy hiệu tròn + góc vàng
      brackets(g, side, side, W - side, y0, s, t.line);
      g.fillStyle = t.paper; g.beginPath(); g.arc(W / 2, 54 * s, 46 * s, 0, 7); g.fill();
      g.strokeStyle = t.line; g.lineWidth = 3 * s; g.stroke();
      g.font = `700 ${54 * s}px "Noto Serif SC", "Noto Serif CJK SC", "Songti SC", "SimSun", "Microsoft YaHei", serif`;
      g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = t.line;
      g.fillText('囍', W / 2, 56 * s); g.textBaseline = 'alphabetic';
    }
  },
  band(g, W, H, s, t) {   // dải màu đặc phía dưới
    const bh = 150 * s;
    let fill = t.band;
    if (t.band2) { fill = g.createLinearGradient(0, 0, W, 0); fill.addColorStop(0, t.band); fill.addColorStop(1, t.band2); }
    outline(g, 14 * s, 14 * s, W - 28 * s, H - 28 * s, 12 * s, t.line, 2 * s, s);
    g.save(); g.shadowColor = 'rgba(0,0,0,.4)'; g.shadowBlur = 16 * s;
    g.fillStyle = fill; g.fillRect(0, H - bh, W, bh); g.restore();
    g.fillStyle = t.line; g.fillRect(0, H - bh, W, 4 * s);
    pill(g, CFG.title.toUpperCase(), W / 2, 58 * s, s, fill, t.line);
    paintNames(g, fitNames(g, W - 100 * s, 66 * s), W / 2, H - bh + 84 * s, t.ink, t.amp);
    label(g, CFG.date, W / 2, H - 30 * s, 15 * s, t.line, 6 * s);
  },
  plaque(g, W, H, s, t) {   // góc art-deco + bảng tên đặc
    fade(g, W, H, .35);
    brackets(g, 0, 0, W, H, s, t.line);
    const f = fitNames(g, W - 240 * s, 64 * s), pw = Math.max(f.w + 100 * s, 360 * s), ph = 160 * s, py = H - 44 * s - ph, px = (W - pw) / 2;
    g.save(); g.shadowColor = 'rgba(0,0,0,.45)'; g.shadowBlur = 16 * s;
    g.fillStyle = t.panel; rr(g, px, py, pw, ph, 18 * s); g.fill(); g.restore();
    g.strokeStyle = t.title; g.lineWidth = 2 * s; rr(g, px + 8 * s, py + 8 * s, pw - 16 * s, ph - 16 * s, 12 * s); g.stroke();
    label(g, CFG.title.toUpperCase(), W / 2, py + 42 * s, 13 * s, t.title, 4 * s);
    paintNames(g, f, W / 2, py + 102 * s, t.ink, t.amp);
    label(g, CFG.date, W / 2, py + 134 * s, 14 * s, t.title, 6 * s);
  },
  luxe(g, W, H, s, t) {   // viền đen + nhãn tên góc trái
    const b = 20 * s;
    frameHole(g, W, H, b, b, 6 * s, t.paper);
    outline(g, b + 10 * s, b + 10 * s, W - 2 * b - 20 * s, H - 2 * b - 20 * s, 4 * s, t.line, 1.5 * s, s);
    const f = fitNames(g, W * .62, 56 * s), tw = f.w + 80 * s, th = 118 * s, ty = H - b - th;
    g.fillStyle = t.paper; g.fillRect(b, ty, tw, th);
    g.fillStyle = t.line; g.fillRect(b + 40 * s, ty + 18 * s, 50 * s, 2 * s);
    paintNames(g, f, b + 40 * s, ty + 72 * s, t.ink, t.amp, 'left');
    label(g, CFG.date, b + 40 * s, ty + 100 * s, 14 * s, t.line, 5 * s, 'left');
    const ttl = CFG.title.toUpperCase();
    g.font = `600 ${13 * s}px ${SANS}`; track(g, 4 * s);
    const ww = g.measureText(ttl).width + 50 * s; track(g, 0);
    g.fillStyle = t.paper; g.fillRect(W - b - ww, b, ww, 46 * s);
    label(g, ttl, W - b - ww / 2, b + 29 * s, 13 * s, t.line, 4 * s);
  },
};

function paintFrame(g, W, H, t) {
  g.save(); g.textBaseline = 'alphabetic';
  LAYOUTS[t.layout](g, W, H, Math.min(W, H) / 720, t);
  g.restore();
}
function renderOverlay() {
  const g = ov.getContext('2d');
  g.clearRect(0, 0, ov.width, ov.height);
  paintFrame(g, ov.width, ov.height, theme);
}

function sizeCanvas() {
  if (state === 'idle') {   // đang ghi thì giữ nguyên kích thước video
    const [W, H] = [720, 960];   // khung camera dạng dọc: cao/ngang = 4/3
    if (ov.width !== W || ov.height !== H) { cv.width = ov.width = W; cv.height = ov.height = H; renderOverlay(); }
  }
  const r = $('#stage').getBoundingClientRect(), k = Math.min(r.width / cv.width, r.height / cv.height);
  Object.assign($('#cvwrap').style, { width: cv.width * k + 'px', height: cv.height * k + 'px' });
}
const ro = new ResizeObserver(() => { sizeCanvas(); fitNamesEl(); });
ro.observe($('#stage'));

function drawVideo(g, W, H) {
  const vw = video.videoWidth, vh = video.videoHeight;
  if (!vw) return false;
  const k = Math.max(W / vw, H / vh), sw = W / k, sh = H / k;
  g.save();
  if (facing === 'user') { g.translate(W, 0); g.scale(-1, 1); }   // camera trước: lật như soi gương
  g.drawImage(video, (vw - sw) / 2, (vh - sh) / 2, sw, sh, 0, 0, W, H);
  g.restore();
  return true;
}
function draw() {
  if (dead.v) return;
  requestAnimationFrame(draw);
  if (drawVideo(ctx, cv.width, cv.height)) ctx.drawImage(ov, 0, 0);
}

function setTheme(id, remember) {
  theme = THEMES.find(t => t.id === id) || THEMES[0];
  $('#frameBtn').title = 'Khung: ' + theme.name;
  if (remember) try { localStorage.setItem('wm-frame', theme.id); } catch (e) {}
  renderOverlay();
}
$('#frameBtn').onclick = () => {   // xem trước cả 10 khung trên hình camera hiện tại
  const W = 240, H = Math.round(W * cv.height / cv.width);
  $('#fgrid').replaceChildren(...THEMES.map(t => {
    const b = document.createElement('button'), c = document.createElement('canvas'), g = c.getContext('2d');
    c.width = W; c.height = H;
    if (!drawVideo(g, W, H)) {
      const gr = g.createLinearGradient(0, 0, W, H);
      gr.addColorStop(0, '#f4f1ea'); gr.addColorStop(1, '#2a2226');
      g.fillStyle = gr; g.fillRect(0, 0, W, H);
    }
    paintFrame(g, W, H, t);
    b.className = t === theme ? 'on' : '';
    b.append(c, t.name);
    b.onclick = () => { setTheme(t.id, true); $('#frames').close(); };
    return b;
  }));
  $('#frames').showModal();
};

function fitNamesEl() {   // tên cô dâu chú rể luôn một dòng: co chữ cho vừa chiều ngang
  const el = $('#sNames');
  if (!el) return;
  el.style.fontSize = '';
  let size = parseFloat(getComputedStyle(el).fontSize);
  while (el.scrollWidth > el.clientWidth && size > 14) { size -= 1.5; el.style.fontSize = size + 'px'; }
}
function applyNames() {
  $('#sTitle').textContent = CFG.title;
  $('#sDate').textContent = CFG.date;
  $('#sNames').replaceChildren(CFG.groom + ' ', Object.assign(document.createElement('i'), { textContent: '&' }), ' ' + CFG.bride);
  fitNamesEl();
  renderOverlay();
  if (document.fonts) Promise.all([
    document.fonts.load(`700 40px ${SCRIPT}`, CFG.groom + CFG.bride + '&'),
    document.fonts.load(`600 16px ${SANS}`, CFG.title.toUpperCase() + CFG.date),
    document.fonts.load('700 54px "Noto Serif SC"', '囍'),
  ]).catch(() => {}).then(() => { renderOverlay(); fitNamesEl(); });
}

/* ---------- Camera ---------- */
async function openCam() {
  if (cam) cam.getTracks().forEach(t => t.stop());
  cam = null;
  try {
    cam = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: { echoCancellation: true, noiseSuppression: true },
    });
  } catch (e) { return camError(e); }
  $('#camErr').hidden = true;
  video.srcObject = cam;
  video.play().catch(() => {});
  navigator.mediaDevices.enumerateDevices()
    .then(ds => { $('#flip').hidden = ds.filter(d => d.kind === 'videoinput').length < 2; }).catch(() => {});
  if (!drawing) { drawing = true; draw(); }
}

function camError(e) {
  const n = e && e.name;
  $('#camErrMsg').textContent =
    n === 'NotAllowedError' ? 'Bạn chưa cho phép dùng camera và micro. Hãy cho phép trong cài đặt trình duyệt (biểu tượng ổ khoá cạnh địa chỉ web), rồi bấm Thử lại.'
    : n === 'NotFoundError' || n === 'OverconstrainedError' ? 'Không tìm thấy camera hoặc micro trên thiết bị này.'
    : n === 'NotReadableError' ? 'Camera đang được ứng dụng khác sử dụng. Hãy tắt ứng dụng đó rồi bấm Thử lại.'
    : 'Trình duyệt này không ghi hình được. Nếu bạn đang mở trong Zalo hoặc Facebook, hãy chọn "Mở bằng trình duyệt" (Chrome hoặc Safari).';
  $('#camErr').hidden = false;
}
$('#retry').onclick = openCam;
$('#flip').onclick = () => { facing = facing === 'user' ? 'environment' : 'user'; openCam(); };

/* ---------- Tuỳ chọn ---------- */
function seg(el, cb) { el.onclick = e => { const b = e.target.closest('button'); if (b) cb(b.dataset); }; }
function mark(el, attr, val) { el.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset[attr] === String(val))); }
seg($('#durs'), d => { dur = +d.d; mark($('#durs'), 'd', dur); });
function setPriv(v) {
  priv = v;
  root.querySelectorAll('.privs').forEach(el => mark(el, 'p', +v));
  $('#privNote').textContent = v ? '🔒 Riêng tư: chỉ cô dâu chú rể (người có mã) xem được.' : '🌐 Công khai: mọi người đều xem được lời chúc này.';
}
root.querySelectorAll('.privs').forEach(el => seg(el, d => setPriv(d.p === '1')));
setPriv(false);

let hi = 0;
const showHint = () => { $('#hint').textContent = '💡 ' + HINTS[hi++ % HINTS.length]; };
showHint();
const hintIv = setInterval(showHint, 7000);

/* ---------- Ghi hình ---------- */
const busy = on => root.classList.toggle('wm-busy', on);
const limit = () => dur || CFG.max_minutes * 60;   // "Không giới hạn" vẫn dừng ở max_minutes để file không quá lớn
$('#rec').onclick = () => state === 'idle' ? countdown() : state === 'rec' && stopRec();   // quay: đếm ngược 3 giây; đang quay: bấm để dừng

// Nhấn nút đỏ: đếm ngược 3 giây rồi bắt đầu quay.
function countdown() {
  if (!cam) return openCam();
  state = 'count'; busy(true);
  let n = 3;
  const el = $('#count'); el.textContent = n; el.hidden = false;
  countIv = setInterval(() => { if (--n) el.textContent = n; else { clearInterval(countIv); el.hidden = true; startRec(); } }, 1000);
}

function startRec() {
  const vs = typeof cv.captureStream === 'function' ? cv.captureStream(30) : cam;   // không có captureStream: ghi thẳng camera (không có khung)
  const stream = new MediaStream([...vs.getVideoTracks(), ...cam.getAudioTracks()]);
  try { rec = new MediaRecorder(stream, { ...(MIME && { mimeType: MIME }), videoBitsPerSecond: 2.5e6 }); }
  catch (e) { toast('Trình duyệt này không ghi được video. Hãy dùng Chrome hoặc Safari.'); state = 'idle'; return busy(false); }
  chunks = [];
  rec.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
  rec.onstop = () => { if (vs !== cam) vs.getVideoTracks().forEach(t => t.stop()); finish(); };
  rec.start(1000);
  state = 'rec'; t0 = performance.now(); thumbs = null;
  setTimeout(() => { if (state === 'rec') thumbs = snapAll(); }, 1500);
  $('#durs').hidden = true;
  tick(); tickIv = setInterval(tick, 250);
}

// Trên nút đỏ: số giây còn lại (đếm ngược); vòng tròn bên ngoài chạy theo thời gian đã quay.
function tick() {
  const s = (performance.now() - t0) / 1000, left = Math.max(0, Math.ceil(limit() - s));
  $('#recTime').textContent = left > 99 ? mmss(left) : left;
  $('#ring').style.strokeDashoffset = C * (1 - Math.min(s / limit(), 1));
  if (s >= limit()) stopRec();
}

function stopRec() {
  if (state !== 'rec') return;
  state = 'stopping'; clearInterval(tickIv);
  secs = (performance.now() - t0) / 1000;
  thumbs = thumbs || snapAll();
  rec.stop();
}

const snap = w => new Promise(r => {
  const c = document.createElement('canvas');
  c.width = w; c.height = Math.round(w * cv.height / cv.width);
  c.getContext('2d').drawImage(cv, 0, 0, c.width, c.height);
  c.toBlob(b => r(b || new Blob()), 'image/jpeg', .8);
});
const snapAll = () => Promise.all([snap(480), snap(24)]);   // ảnh nhỏ + ảnh 24px (hiện mờ cho clip riêng tư)

async function finish() {
  if (discard) {   // đóng hộp thoại giữa chừng: bỏ clip đang quay
    discard = false; chunks = []; state = 'idle'; busy(false);
    $('#durs').hidden = false; $('#recTime').textContent = ''; $('#ring').style.strokeDashoffset = C;
    return;
  }
  const type = rec.mimeType || MIME || 'video/webm';
  const blob = new Blob(chunks, { type: type.split(';')[0] });
  const th = await thumbs;
  state = 'idle'; busy(false);
  $('#durs').hidden = false; $('#recTime').textContent = ''; $('#ring').style.strokeDashoffset = C;
  sizeCanvas();   // máy có thể đã xoay trong lúc ghi
  if (secs < 2 || !blob.size) return toast('Clip ngắn quá, bạn ghi lại nhé.');
  pending = { blob, type, secs, th };
  state = 'review';
  $('#rv').src = URL.createObjectURL(blob);
  $('#review').showModal();
  $('#rv').play().catch(() => {});
}

function closeReview() {
  const rv = $('#rv'), src = rv.src;
  rv.pause(); rv.removeAttribute('src'); rv.load(); URL.revokeObjectURL(src);
  $('#review').close();
  pending = null; state = 'idle';
}
$('#review').oncancel = e => e.preventDefault();   // phải chọn Gửi hoặc Ghi lại, tránh mất clip vì lỡ bấm Esc
$('#again').onclick = () => { closeReview(); countdown(); };
$('#send').onclick = () => {
  const p = pending;
  if (!p) return;
  const name = $('#guest').value.trim();
  closeReview();
  closeCam();   // xong thì đóng hộp thoại và tắt camera
  enqueue({ id: rid(), type: p.type, name, priv, secs: p.secs, kiosk: KIOSK, thumb: p.th[0], tiny: p.th[1], video: p.blob });
  toast('Cảm ơn bạn! Lời chúc đang được gửi tới cô dâu chú rể 💕');
  if (KIOSK) { $('#guest').value = ''; setPriv(false); }   // máy chung: khách sau bắt đầu lại từ đầu
};

/* ---------- Hộp thoại camera ---------- */
function stopCam() {
  if (cam) cam.getTracks().forEach(t => t.stop());
  cam = null; video.srcObject = null;
}
function openCamDialog() {
  if (!$('#cam').open) $('#cam').showModal();
  requestAnimationFrame(sizeCanvas);   // hộp thoại vừa hiện: đo lại khung 3/4
  if (!cam) openCam();
}
function closeCam() {
  if (state === 'count') { clearInterval(countIv); $('#count').hidden = true; state = 'idle'; busy(false); }
  else if (state === 'rec') { discard = true; clearInterval(tickIv); state = 'stopping'; rec.stop(); }
  stopCam();
  if ($('#cam').open) $('#cam').close();
}
$('#camClose').onclick = closeCam;
$('#cam').oncancel = e => { e.preventDefault(); closeCam(); };
$('#cam').onclose = stopCam;   // đóng bằng cách nào cũng nhả camera và micro

/* ---------- Gửi lên máy chủ ---------- */
// Lưu vào IndexedDB trước, chỉ xoá khi máy chủ đã nhận: mất mạng hay lỡ đóng trang thì lần mở sau vẫn gửi tiếp.
const DB = new Promise(res => {
  try {
    const r = indexedDB.open('wedmemo', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('out');
    r.onsuccess = () => res(r.result);
    r.onerror = () => res(null);
  } catch (e) { res(null); }
});
async function store(fn, mode = 'readwrite') {
  const db = await DB;
  if (!db) return;
  return new Promise(res => {
    try {
      const tx = db.transaction('out', mode), q = fn(tx.objectStore('out'));
      tx.oncomplete = () => res(q.result);
      tx.onerror = tx.onabort = () => res();
    } catch (e) { res(); }
  });
}

let queue = [], pumping = false, pct = 0, offline = false;
async function enqueue(item) { await store(s => s.put(item, item.id)); queue.push(item); pump(); }

async function pump() {
  if (pumping) return;
  pumping = true;
  while (queue.length && !dead.v) {
    const it = queue[0];
    pct = 0; showUp();
    try {
      await upload(it);
      queue.shift(); offline = false;
      await store(s => s.delete(it.id));
      refresh();   // clip vừa gửi xong hiện ngay trong dải thumbnail
    } catch (e) {
      if (e.permanent) { queue.shift(); toast('Không gửi được một lời chúc: ' + e.message); }   // vẫn còn trong IndexedDB
      else { offline = true; showUp(); await new Promise(r => setTimeout(r, 5000)); }
    }
  }
  pumping = false; showUp();
}

function upload(it) {
  return new Promise((res, rej) => {
    const x = new XMLHttpRequest();
    x.open('POST', BASE + 'api/clips');
    const h = { 'X-Clip': it.id, 'X-Parts': `${it.thumb.size},${it.tiny.size}`, 'X-Video-Type': it.type, 'X-Name': encodeURIComponent(it.name),
      'X-Private': it.priv ? '1' : '0', 'X-Secs': it.secs.toFixed(1), 'X-Kiosk': it.kiosk ? '1' : '0' };
    for (const k in h) x.setRequestHeader(k, h[k]);
    x.upload.onprogress = e => { pct = e.total ? Math.round(e.loaded / e.total * 100) : 0; showUp(); };
    x.onload = () => {
      if (x.status === 200) return res();
      let msg = 'lỗi ' + x.status;
      try { msg = JSON.parse(x.responseText).error || msg; } catch (e) {}
      rej(Object.assign(new Error(msg), { permanent: x.status >= 400 && x.status < 500 }));
    };
    x.onerror = x.ontimeout = () => rej(new Error('mạng'));
    x.send(new Blob([it.thumb, it.tiny, it.video], { type: 'application/octet-stream' }));
  });
}

function showUp() {
  const el = $('#up');
  el.hidden = !queue.length;
  el.textContent = offline ? `⚠ Chờ mạng (${queue.length})` : `⏫ ${queue.length > 1 ? queue.length + ' · ' : ''}${pct}%`;
  el.title = offline ? 'Mất kết nối – lời chúc vẫn được giữ lại và sẽ tự gửi khi có mạng' : 'Đang gửi lời chúc';
}

/* ---------- Dải thumbnail lời chúc (cuối sector) ---------- */
async function refresh() {
  try {
    const r = await fetch(BASE + 'api/clips' + (key ? '?k=' + encodeURIComponent(key) : ''));
    if (r.ok) list = await r.json();
  } catch (e) { toast('Không tải được danh sách, hãy kiểm tra mạng.'); }
  $('#grid').replaceChildren(...list.map(card));
  $('#empty').hidden = list.length > 0;
  $('#gcount').textContent = list.length || '';
  $('#lockBtn').textContent = key ? '🔒 Khoá lại' : '🔓 Mở khoá';
}

function card(c, i) {
  const b = document.createElement('button');
  b.className = 'card' + (c.video ? '' : ' lock');
  b.innerHTML = '<img alt="" loading="lazy"><span class="ico"></span><span class="badge"></span><span class="meta"><b></b><small></small></span>';
  const img = b.querySelector('img');
  img.onerror = () => img.remove();
  img.src = BASE + c.thumb;
  b.querySelector('.ico').textContent = c.video ? '▶' : '🔒';
  b.querySelector('.badge').textContent = mmss(c.secs);
  b.querySelector('b').textContent = c.name || 'Khách mời';
  b.querySelector('small').textContent = (c.private ? '🔒 Riêng tư · ' : '') + when(c.ts);
  b.onclick = () => c.video ? play(i) : askCode();
  return b;
}

function play(i) {
  cur = i;
  const c = list[i];
  pv.src = BASE + c.video;
  pv.play().catch(() => {});
  $('#pname').textContent = c.name || 'Khách mời';
  $('#pmeta').textContent = `${c.private ? '🔒 Riêng tư' : '🌐 Công khai'} · ${when(c.ts)} · ${mmss(c.secs)}`;
  $('#del').hidden = !key;
  if (!$('#player').open) $('#player').showModal();
}
const step = d => { for (let j = cur + d; j >= 0 && j < list.length; j += d) if (list[j].video) return play(j); };
$('#prev').onclick = () => step(-1);
$('#next').onclick = () => step(1);
pv.onended = () => step(1);   // tự phát lời chúc tiếp theo
$('#player').onclose = () => { pv.pause(); pv.removeAttribute('src'); pv.load(); };
$('#del').onclick = async () => {
  if (!confirm('Xoá lời chúc này? (vẫn khôi phục được từ thư mục trash trên máy chủ)')) return;
  const r = await fetch(BASE + `api/clips/${list[cur].id}/delete?k=${encodeURIComponent(key)}`, { method: 'POST' }).catch(() => null);
  if (r && r.ok) { $('#player').close(); refresh(); } else toast('Không xoá được, hãy mở khoá lại.');
};

function askCode() { $('#code').value = ''; $('#err').textContent = ''; $('#pin').showModal(); $('#code').focus(); }
$('#lockBtn').onclick = () => { if (key) { key = null; refresh(); } else askCode(); };
$('#unlock').onclick = async () => {
  const r = await fetch(BASE + 'api/unlock', { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: $('#code').value.trim() }) }).catch(() => null);
  const j = r ? await r.json().catch(() => ({})) : {};
  if (r && r.ok) { key = j.k; $('#pin').close(); refresh(); }
  else $('#err').textContent = j.error || 'Lỗi mạng, hãy thử lại.';
};
$('#code').onkeydown = e => { if (e.key === 'Enter') $('#unlock').click(); };
root.querySelectorAll('[data-close]').forEach(b => { b.onclick = () => b.closest('dialog').close(); });

/* ---------- Toàn màn hình, máy ở sảnh (kiosk) ---------- */
let idle;
async function enterFs() {
  try { await document.documentElement.requestFullscreen({ navigationUI: 'hide' }); } catch (e) { return; }   // iPhone không hỗ trợ
  if (KIOSK) try { await navigator.keyboard.lock(['Escape']); } catch (e) {}   // Chrome/Edge: phải giữ Esc 2 giây mới thoát được
}
let wl = null;
async function wake() { try { wl = await navigator.wakeLock.request('screen'); } catch (e) {} }   // không cho màn hình tắt
listen(document, 'visibilitychange', () => { if (document.visibilityState === 'visible' && (KIOSK || $('#cam').open)) wake(); });

$('#startBtn').onclick = () => { if (KIOSK) enterFs(); wake(); openCamDialog(); };
$('#fs').hidden = true;   // trong thiệp không cần nút toàn màn hình
$('#fs').onclick = () => document.fullscreenElement ? document.exitFullscreen() : enterFs();

if (KIOSK) {
  listen(document, 'fullscreenchange', () => { $('#fsguard').hidden = !!document.fullscreenElement || !$('#cam').open; });
  $('#fsguard').onclick = () => { $('#fsguard').hidden = true; enterFs(); };
  listen(window, 'contextmenu', e => e.preventDefault());
  // 90 giây không ai chạm: tự gửi clip đang xem lại (khách sau không thấy được), đóng thư viện (khoá lại), về màn hình chào có mã QR
  idle = undefined;
  const onIdle = () => {
    if (!pv.paused || state === 'rec' || state === 'count' || state === 'stopping') return bump();
    if ($('#review').open) $('#send').click();
    ['#pin', '#player'].forEach(d => { if ($(d).open) $(d).close(); });
    closeCam();   // về màn hình chào, tắt camera
    key = null; refresh();   // máy sảnh: khoá lại clip riêng tư
  };
  const bump = () => { clearTimeout(idle); idle = setTimeout(onIdle, 90e3); };
  ['pointerdown', 'keydown'].forEach(e => listen(window, e, bump, { capture: true, passive: true }));
  bump();
}
listen(window, 'beforeunload', e => {
  if (KIOSK || queue.length || pending || state === 'rec') { e.preventDefault(); e.returnValue = ''; }
});

function toast(t) {
  const el = $('#toast');
  el.textContent = t; el.hidden = false;
  try { el.hidePopover(); el.showPopover(); } catch (e) {}   // popover nổi trên cả hộp thoại đang mở
  clearTimeout(el.t);
  el.t = setTimeout(() => { el.hidden = true; try { el.hidePopover(); } catch (e) {} }, 4500);
}

/* ---------- Khởi động ---------- */
let savedFrame = null;
try { savedFrame = localStorage.getItem('wm-frame'); } catch (e) {}
sizeCanvas();
setTheme(savedFrame);
applyNames();
if (!savedFrame && CFG.frame) setTheme(CFG.frame);
refresh();
store(s => s.getAll(), 'readonly').then(items => { if (items && items.length) { queue.push(...items); pump(); } });

return {
  setCfg(c) { CFG = c; if (!savedFrame && c.frame) setTheme(c.frame); applyNames(); },
  destroy() {
    dead.v = true;
    clearInterval(hintIv); clearInterval(tickIv); clearTimeout(idle);
    ro.disconnect();
    offs.forEach(f => f());
    if (cam) cam.getTracks().forEach(t => t.stop());
    try { if (rec && rec.state === 'recording') { rec.onstop = null; rec.stop(); } } catch (e) {}
    try { wl && wl.release(); } catch (e) {}
    root.querySelectorAll('dialog[open]').forEach(d => d.close());
    video.remove();
  },
};
}
