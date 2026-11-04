import { ImageResponse } from "next/og";
import { connection } from "next/server";
import { dateInfo } from "@/content/wedding";
import { getConfig } from "@/lib/config";

export const alt = "Thiệp mời cưới";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const fontCache = new Map<string, ArrayBuffer | null>();

/** Tải bộ font con từ Google Fonts chỉ gồm các ký tự cần vẽ (có dấu tiếng Việt). */
async function loadFont(family: string, text: string) {
  const key = `${family}|${text}`;
  if (fontCache.has(key)) return fontCache.get(key)!;
  const data = await fetchFont(family, text);
  if (data) fontCache.set(key, data);
  return data;
}

async function fetchFont(family: string, text: string) {
  try {
    const css = await (await fetch(`https://fonts.googleapis.com/css2?family=${family}&text=${encodeURIComponent(text)}`)).text();
    const url = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/)?.[1];
    if (!url) return null;
    return await (await fetch(url)).arrayBuffer();
  } catch {
    return null;
  }
}

function Petal({ angle }: { angle: number }) {
  return (
    <div
      style={{
        position: "absolute",
        left: 34,
        top: -6,
        width: 22,
        height: 52,
        borderRadius: 999,
        background: "#fff",
        border: "2px solid #e4d8c2",
        transformOrigin: "11px 46px",
        transform: `rotate(${angle}deg)`,
      }}
    />
  );
}

function Daisy({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return (
    <div style={{ position: "absolute", left: x, top: y, width: 90, height: 90, display: "flex", transform: `scale(${scale})` }}>
      {Array.from({ length: 14 }, (_, i) => (
        <Petal key={i} angle={(360 / 14) * i} />
      ))}
      <div style={{ position: "absolute", left: 28, top: 28, width: 34, height: 34, borderRadius: 999, background: "#F2C14E", border: "3px solid #d9a43a" }} />
    </div>
  );
}

export default async function Image() {
  // Vẽ theo cấu hình hiện tại (tên, ngày cưới) mỗi lần được gọi.
  await connection();
  const config = getConfig();
  const { groom, bride } = config;
  const date = dateInfo(config);
  const dateText = `${date.weekday} · ${date.dots}`;
  const script = await loadFont("Dancing+Script:wght@600", `${groom.name}&${bride.name}`);
  const serif = await loadFont("Playfair+Display", `${dateText}THIỆP MỜI CƯỚI · Trân trọng kính mời!`);
  const fonts = [
    script && { name: "Script", data: script, style: "normal" as const, weight: 600 as const },
    serif && { name: "Serif", data: serif, style: "normal" as const, weight: 400 as const },
  ].filter((f): f is NonNullable<typeof f> => !!f);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#F3EBDD",
          color: "#3F3326",
          position: "relative",
          fontFamily: "Serif",
        }}
      >
        <div style={{ position: "absolute", inset: 28, border: "2px solid #d9cbb2", borderRadius: 32, display: "flex" }} />
        <Daisy x={70} y={70} scale={1.3} />
        <Daisy x={160} y={430} scale={0.8} />
        <Daisy x={1030} y={420} scale={1.4} />
        <Daisy x={980} y={80} scale={0.7} />
        <div style={{ fontSize: 30, letterSpacing: 10, color: "#6B7A45" }}>THIỆP MỜI CƯỚI</div>
        <div style={{ display: "flex", alignItems: "center", fontFamily: "Script", fontSize: 120, marginTop: 10 }}>
          {groom.name}
          <span style={{ color: "#C9877A", fontSize: 90, margin: "0 28px" }}>&</span>
          {bride.name}
        </div>
        <div style={{ fontSize: 40, marginTop: 16 }}>{dateText}</div>
        <div style={{ fontSize: 28, marginTop: 18, color: "#6e5f4d" }}>Trân trọng kính mời!</div>
      </div>
    ),
    { ...size, fonts },
  );
}
