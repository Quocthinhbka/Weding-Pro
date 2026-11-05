import { coupleNames, dateInfo, eventsAt, venueById, type WeddingConfig, type WeddingEvent } from "@/content/wedding";
import { vnDate } from "./wedding-time";

const EVENT_HOURS = 2;

function icsDate(d: Date) {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function escapeText(s: string) {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

/** Gập dòng theo RFC 5545: tối đa 75 byte mỗi dòng, không cắt giữa ký tự UTF-8. */
export function foldLine(line: string) {
  const encoder = new TextEncoder();
  const out: string[] = [];
  let current = "";
  let bytes = 0;
  for (const ch of line) {
    const size = encoder.encode(ch).length;
    const limit = out.length === 0 ? 75 : 74; // dòng tiếp theo bắt đầu bằng 1 dấu cách
    if (bytes + size > limit) {
      out.push(current);
      current = "";
      bytes = 0;
    }
    current += ch;
    bytes += size;
  }
  out.push(current);
  return out.join("\r\n ");
}

export function eventsForVenue(c: WeddingConfig, venueId: string | "all"): WeddingEvent[] {
  return venueId === "all" ? [...c.events].sort((a, b) => a.time.localeCompare(b.time)) : eventsAt(c, venueId);
}

export function eventRange(c: WeddingConfig, e: WeddingEvent) {
  const start = vnDate(c.date.iso, e.time);
  const end = new Date(start.getTime() + EVENT_HOURS * 3600_000);
  return { start, end };
}

export function buildIcs(c: WeddingConfig, events: WeddingEvent[], now = new Date()) {
  const info = dateInfo(c);
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Thiep cuoi//VI",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];
  for (const e of events) {
    const venue = venueById(c, e.venueId);
    const { start, end } = eventRange(c, e);
    lines.push(
      "BEGIN:VEVENT",
      `UID:${e.id}-${c.date.iso}@thiep-cuoi`,
      `DTSTAMP:${icsDate(now)}`,
      `DTSTART:${icsDate(start)}`,
      `DTEND:${icsDate(end)}`,
      `SUMMARY:${escapeText(`${e.title} · ${coupleNames(c)}`)}`,
      `LOCATION:${escapeText(venue ? `${venue.name}, ${venue.address}`.replace(/\s+/g, " ") : "")}`,
      `DESCRIPTION:${escapeText(`${e.title} lúc ${e.time}, ${info.weekday} ${info.day}/${info.month}/${info.year} (tức ${info.lunar}).`)}`,
      "BEGIN:VALARM",
      "TRIGGER:-PT2H",
      "ACTION:DISPLAY",
      `DESCRIPTION:${escapeText(e.title)}`,
      "END:VALARM",
      "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR");
  return lines.map(foldLine).join("\r\n") + "\r\n";
}

/** Link Google Calendar cho một địa điểm: từ sự kiện đầu tiên đến hết sự kiện cuối. */
export function googleCalendarUrl(c: WeddingConfig, venueId: string) {
  const events = eventsAt(c, venueId);
  const venue = venueById(c, venueId);
  if (!venue || events.length === 0) return "";
  const start = eventRange(c, events[0]).start;
  const end = eventRange(c, events[events.length - 1]).end;
  const details = events.map((e) => `${e.time} – ${e.title}`).join("\n");
  const main = events[events.length - 1];
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `${main.title} · ${coupleNames(c)}`,
    dates: `${icsDate(start)}/${icsDate(end)}`,
    details: `${details}\n(${dateInfo(c).lunar})`,
    location: `${venue.name}, ${venue.address}`.replace(/\s+/g, " "),
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}
