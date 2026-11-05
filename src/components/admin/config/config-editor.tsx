"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { saveSettings } from "@/app/admin/actions";
import type { QuizQuestion } from "@/content/quiz";
import { BANK_APPS } from "@/content/banks";
import { dateInfo, MAX_ALBUM, MAX_STORY, SECTION_LABELS, type SectionKey, type WeddingConfig } from "@/content/wedding";
import { lunarText } from "@/lib/lunar";
import { ConfigPreview } from "./config-preview";
import { CropDialog, type Aspects } from "./crop-dialog";
import { AddButton, AudioField, Card, ImageField, ItemTools, move, newId, NumberField, TextArea, TextField, uploadFile } from "./fields";

const NAV = [
  ["co-dau-chu-re", "Cô dâu & chú rể"],
  ["gia-dinh", "Gia đình"],
  ["ngay-cuoi", "Ngày cưới"],
  ["dia-diem", "Địa điểm & lịch trình"],
  ["loi-moi", "Lời mời"],
  ["anh-bia", "Ảnh bìa & nhạc"],
  ["chuyen-tinh", "Chuyện tình"],
  ["album", "Album"],
  ["mung-cuoi", "Mừng cưới"],
  ["tro-choi", "Trò chơi"],
  ["hien-thi", "Hiển thị"],
] as const;

// Mục cấu hình -> phần tương ứng trong thiệp, để khung xem trước tự cuộn tới đúng chỗ đang chỉnh.
const PREVIEW_SECTION: Record<string, string> = {
  "co-dau-chu-re": "couple",
  "gia-dinh": "family",
  "ngay-cuoi": "countdown",
  "dia-diem": "schedule",
  "loi-moi": "family",
  "anh-bia": "hero",
  "chuyen-tinh": "story",
  album: "album",
  "mung-cuoi": "gifts",
  "tro-choi": "games",
};

export function ConfigEditor({ initialConfig, initialQuiz }: { initialConfig: WeddingConfig; initialQuiz: QuizQuestion[] }) {
  const [config, setConfig] = useState(initialConfig);
  const [quiz, setQuiz] = useState(initialQuiz);
  const [saved, setSaved] = useState(() => JSON.stringify([initialConfig, initialQuiz]));
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const [previewOpen, setPreviewOpen] = useState(false); // chỉ dùng trên màn hình hẹp
  const [section, setSection] = useState<{ sec: string; n: number } | null>(null);
  const lastSec = useRef("");
  const showSection = (id: string) => {
    const sec = PREVIEW_SECTION[id];
    if (!sec || sec === lastSec.current) return;
    lastSec.current = sec;
    setSection((prev) => ({ sec, n: (prev?.n ?? 0) + 1 }));
  };
  const dirty = JSON.stringify([config, quiz]) !== saved;
  // Có thay đổi mới thì ẩn thông báo "đã lưu" cũ.
  const status = dirty && message?.ok ? null : message;

  // Cập nhật bằng cách sửa trực tiếp trên bản sao.
  const edit = (fn: (draft: WeddingConfig) => void) =>
    setConfig((c) => {
      const d = structuredClone(c);
      fn(d);
      return d;
    });
  const editQuiz = (fn: (draft: QuizQuestion[]) => void) =>
    setQuiz((q) => {
      const d = structuredClone(q);
      fn(d);
      return d;
    });

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function save() {
    setMessage(null);
    start(async () => {
      const res = await saveSettings(config, quiz);
      if ("error" in res) {
        setMessage({ ok: false, text: res.error ?? "Chưa lưu được" });
      } else {
        setSaved(JSON.stringify([config, quiz]));
        setMessage({ ok: true, text: "Đã lưu – thiệp đã được cập nhật ✓" });
      }
    });
  }

  const date = dateInfo(config);

  return (
    <div className="pb-24">
      <div>
        <h1 className="font-serif text-2xl font-semibold">Cấu hình thiệp</h1>
        <p className="mt-1 text-sm text-ink-soft">Chỉnh nội dung rồi bấm “Lưu thay đổi” ở cuối màn hình – thiệp được cập nhật ngay.</p>
        <nav className="mt-3 flex flex-wrap gap-1.5 text-xs">
          {NAV.map(([id, label]) => (
            <a key={id} href={`#${id}`} onClick={() => showSection(id)} className="whitespace-nowrap rounded-full bg-cream px-3 py-1 ring-1 ring-line hover:bg-white">
              {label}
            </a>
          ))}
        </nav>
      </div>

      {/* Thanh lưu cố định ở đáy màn hình */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-cream/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3">
          <span className={`text-sm ${status?.ok === false || dirty ? "text-[#8a4a3e]" : "text-olive-deep"}`}>
            {status?.text ?? (dirty ? "● Có thay đổi chưa lưu" : "Mọi thay đổi đã được lưu")}
          </span>
          <div className="ml-auto flex items-center gap-2">
            <button type="button" className="btn btn-outline !py-2 !text-xs lg:hidden" onClick={() => setPreviewOpen(true)}>
              📱 Xem trước
            </button>
            <a href="/" target="_blank" className="btn btn-outline !py-2 !text-xs">
              Xem thiệp ↗
            </a>
            <button type="button" className="btn btn-primary !py-2 !text-xs" disabled={pending || !dirty} onClick={save}>
              {pending ? "Đang lưu…" : "Lưu thay đổi"}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div
          className="min-w-0 space-y-6"
          onFocusCapture={(e) => showSection((e.target as HTMLElement).closest("section[id]")?.id ?? "")}
        >
      <Card id="co-dau-chu-re" title="Cô dâu & chú rể">
        <div className="grid gap-6 sm:grid-cols-2">
          {(["groom", "bride"] as const).map((who) => (
            <div key={who} className="space-y-3">
              <p className="font-semibold">{who === "groom" ? "Chú rể" : "Cô dâu"}</p>
              <TextField label="Tên hiển thị" value={config[who].name} maxLength={40} onChange={(v) => edit((d) => void (d[who].name = v))} />
              <TextField label="Năm sinh (không bắt buộc)" value={config[who].born} maxLength={20} onChange={(v) => edit((d) => void (d[who].born = v))} />
              <ImageField label="Ảnh chân dung (dọc, tỉ lệ 3:4)" value={config[who].photo} ratio={3 / 4} outSide={1600} onChange={(v) => edit((d) => void (d[who].photo = v))} className="max-w-[220px]" />
            </div>
          ))}
        </div>
      </Card>

      <Card id="gia-dinh" title="Đại diện gia đình">
        <div className="grid gap-6 sm:grid-cols-2">
          {(["trai", "gai"] as const).map((side) => (
            <div key={side} className="space-y-3">
              <TextField multiline label="Tiêu đề" value={config.families[side].label} onChange={(v) => edit((d) => void (d.families[side].label = v))} />
              {config.families[side].members.map((m, i) => (
                <div key={i} className="flex items-end gap-2">
                  <TextField label="Vai trò" value={m.role} placeholder="Bố / Mẹ / Ông…" className="w-24" onChange={(v) => edit((d) => void (d.families[side].members[i].role = v))} />
                  <TextField label="Họ tên" value={m.name} className="flex-1" onChange={(v) => edit((d) => void (d.families[side].members[i].name = v))} />
                  <button
                    type="button"
                    className="mb-1 h-10 rounded-lg border border-line bg-white px-2.5 text-xs text-[#8a4a3e]"
                    onClick={() => edit((d) => void d.families[side].members.splice(i, 1))}
                  >
                    Xoá
                  </button>
                </div>
              ))}
              <AddButton onClick={() => edit((d) => void d.families[side].members.push({ role: "", name: "" }))}>Thêm người</AddButton>
            </div>
          ))}
        </div>
      </Card>

      <Card id="ngay-cuoi" title="Ngày cưới" description="Thứ trong tuần và ngày âm lịch được tự tính từ ngày dương lịch.">
        <div className="grid gap-4 sm:grid-cols-3">
          <TextField label="Ngày cưới (dương lịch)" type="date" value={config.date.iso} onChange={(v) => v && edit((d) => void (d.date.iso = v))} hint={date.weekday} />
          <TextField
            label="Ngày âm lịch"
            value={config.date.lunar}
            placeholder={lunarText(config.date.iso)}
            hint="Để trống để tự tính"
            onChange={(v) => edit((d) => void (d.date.lunar = v))}
          />
          <TextField label="Đếm ngược tới (giờ)" type="time" value={config.date.countdownTime} onChange={(v) => v && edit((d) => void (d.date.countdownTime = v))} />
        </div>
        <p className="rounded-xl bg-paper px-3 py-2 text-sm">
          Hiển thị: <b>{date.weekday}, {date.dots}</b> · Tức ngày <b>{date.lunar}</b>
        </p>
      </Card>

      <Card id="dia-diem" title="Địa điểm & lịch trình" description="Mỗi địa điểm là một lựa chọn “Bạn sẽ dự” trong form xác nhận tham dự.">
        {config.venues.map((v, i) => (
          <div key={v.id} className="space-y-3 rounded-2xl bg-white/70 p-4 ring-1 ring-line">
            <div className="flex items-center justify-between gap-2">
              <p className="font-semibold">Địa điểm {i + 1}</p>
              <ItemTools
                index={i}
                count={config.venues.length}
                onMove={(to) => edit((d) => void (d.venues = move(d.venues, i, to)))}
                onRemove={() => {
                  if (config.events.some((e) => e.venueId === v.id)) {
                    alert("Hãy xoá hoặc chuyển các sự kiện tại địa điểm này trước.");
                    return;
                  }
                  edit((d) => void d.venues.splice(i, 1));
                }}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <TextField multiline label="Tên địa điểm" value={v.name} onChange={(val) => edit((d) => void (d.venues[i].name = val))} />
              <TextField multiline label="Địa chỉ" value={v.address} onChange={(val) => edit((d) => void (d.venues[i].address = val))} />
              <TextField
                label="Toạ độ Google Maps (không bắt buộc)"
                value={v.latLng}
                placeholder="20.123456, 106.123456"
                hint="Giữ tay lên vị trí trong Google Maps rồi chép dãy số. Để trống thì tìm theo địa chỉ."
                onChange={(val) => edit((d) => void (d.venues[i].latLng = val))}
              />
              <TextField
                label="Tên lựa chọn khi xác nhận tham dự"
                value={v.rsvpLabel}
                placeholder="VD: Lễ Vu Quy · Ninh Bình"
                onChange={(val) => edit((d) => void (d.venues[i].rsvpLabel = val))}
              />
            </div>
          </div>
        ))}
        <AddButton onClick={() => edit((d) => void d.venues.push({ id: newId("dd"), name: "", address: "", latLng: "", rsvpLabel: "" }))}>Thêm địa điểm</AddButton>

        <div className="space-y-3 rounded-2xl bg-white/70 p-4 ring-1 ring-line">
          <p className="font-semibold">Thiệp nhà trai và nhà gái</p>
          <p className="text-xs text-ink-soft">
            Link thường (hoặc <code>?f=groom</code>) là thiệp nhà trai, link <code>?f=bride</code> là thiệp nhà gái. Mỗi bên chọn sự kiện hiện ở thẻ “Trân trọng kính mời” (kèm giờ, địa điểm, chỉ đường) và buổi tiệc thân mật hiện dưới phần đại diện gia đình.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {(["groom", "bride"] as const).map((k) => (
              <div key={k} className="space-y-2">
                <p className="text-sm font-medium">{k === "groom" ? "Nhà trai (?f=groom)" : "Nhà gái (?f=bride)"}</p>
                <label className="block">
                  <span className="label">Sự kiện ở thẻ mời</span>
                  <select className="field" value={config.sides[k].eventId} onChange={(e) => edit((d) => void (d.sides[k].eventId = e.target.value))}>
                    {config.events.map((ev) => (
                      <option key={ev.id} value={ev.id}>
                        {ev.time} · {ev.title}
                      </option>
                    ))}
                  </select>
                </label>
                <TextField multiline label="Tên hiện ở thẻ mời" value={config.sides[k].title} maxLength={40} placeholder={k === "groom" ? "Lễ Thành Hôn" : "Lễ Vu Quy"} onChange={(v) => edit((d) => void (d.sides[k].title = v))} />
                <label className="block">
                  <span className="label">Buổi tiệc thân mật</span>
                  <select className="field" value={config.sides[k].feastEventId} onChange={(e) => edit((d) => void (d.sides[k].feastEventId = e.target.value))}>
                    {config.events.map((ev) => (
                      <option key={ev.id} value={ev.id}>
                        {ev.time} · {ev.title}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-2">
          <p className="mb-2 font-semibold">Các mốc giờ</p>
          <div className="space-y-2">
            {config.events.map((e, i) => (
              <div key={e.id} className="grid grid-cols-[150px_1fr] gap-2 rounded-2xl bg-white/70 p-3 ring-1 ring-line sm:grid-cols-[150px_1fr_1fr_auto]">
                <TextField label="Giờ" type="time" value={e.time} onChange={(v) => v && edit((d) => void (d.events[i].time = v))} />
                <TextField multiline label="Tên sự kiện" value={e.title} onChange={(v) => edit((d) => void (d.events[i].title = v))} />
                <label className="col-span-2 block sm:col-span-1">
                  <span className="label">Địa điểm</span>
                  <select className="field" value={e.venueId} onChange={(ev) => edit((d) => void (d.events[i].venueId = ev.target.value))}>
                    <option value="">Không gắn địa điểm</option>
                    {config.venues.map((v, j) => (
                      <option key={v.id} value={v.id}>
                        {v.name || `Địa điểm ${j + 1}`}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  className="self-end mb-1 h-10 rounded-lg border border-line bg-white px-2.5 text-xs text-[#8a4a3e]"
                  onClick={() => {
                    if (Object.values(config.sides).some((sd) => sd.eventId === e.id || sd.feastEventId === e.id)) {
                      alert("Mốc này đang được dùng ở thẻ mời hoặc buổi tiệc thân mật. Hãy chọn mốc khác ở mục “Thiệp nhà trai và nhà gái” trước.");
                      return;
                    }
                    edit((d) => void d.events.splice(i, 1));
                  }}
                >
                  Xoá
                </button>
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-ink-soft">Các mốc giờ tự sắp xếp theo giờ và hiện thành một dòng thời gian trong thiệp.</p>
          <div className="mt-2">
            <AddButton
              onClick={() => edit((d) => void d.events.push({ id: newId("sk"), title: "", time: "12:00", venueId: d.venues[0]?.id ?? "" }))}
            >
              Thêm mốc giờ
            </AddButton>
          </div>
        </div>
      </Card>

      <Card id="loi-moi" title="Lời mời & lời cảm ơn">
        <TextArea label="Lời mời (phần Đại diện gia đình)" value={config.texts.invitation} maxLength={300} onChange={(v) => edit((d) => void (d.texts.invitation = v))} />
        <TextArea label="Lời cảm ơn (cuối thiệp)" value={config.texts.thankYou} maxLength={300} onChange={(v) => edit((d) => void (d.texts.thankYou = v))} />
        <TextField
          multiline
          label="Lời chào trên phong bì khi không có tên khách"
          value={config.texts.guestFallback}
          maxLength={40}
          hint="Khi gửi link mời riêng, phong bì sẽ hiện tên khách thay cho dòng này."
          onChange={(v) => edit((d) => void (d.texts.guestFallback = v))}
        />
      </Card>

      <Card id="anh-bia" title="Ảnh bìa & nhạc nền">
        <div className="grid gap-6 sm:grid-cols-[220px_1fr]">
          <ImageField label="Ảnh bìa (ảnh dọc, tỉ lệ 2:3)" value={config.heroImage} ratio={2 / 3} outSide={1800} onChange={(v) => edit((d) => void (d.heroImage = v))} />
          <div className="space-y-3">
            <AudioField value={config.music.src} onChange={(v) => edit((d) => void (d.music.src = v))} />
            <TextField label="Tên bài hát" value={config.music.title} onChange={(v) => edit((d) => void (d.music.title = v))} />
            <TextField label="Ca sĩ / dòng phụ" value={config.music.artist} onChange={(v) => edit((d) => void (d.music.artist = v))} />
          </div>
        </div>
      </Card>

      <Card id="chuyen-tinh" title="Câu chuyện tình yêu" description={`Thành một sector dài 1,75 màn hình, vuốt lần 2 trượt xuống cuối. Tối đa ${MAX_STORY} kỷ niệm để vừa khung.`}>
        {config.loveStory.map((s, i) => (
          <div key={i} className="grid gap-4 rounded-2xl bg-white/70 p-4 ring-1 ring-line sm:grid-cols-[160px_1fr]">
            <ImageField label="Ảnh (vuông)" value={s.image} ratio={1} outSide={1200} onChange={(v) => edit((d) => void (d.loveStory[i].image = v))} />
            <div className="space-y-3">
              <div className="flex justify-end">
                <ItemTools
                  index={i}
                  count={config.loveStory.length}
                  onMove={(to) => edit((d) => void (d.loveStory = move(d.loveStory, i, to)))}
                  onRemove={() => edit((d) => void d.loveStory.splice(i, 1))}
                />
              </div>
              <TextField multiline label="Tiêu đề" value={s.title} onChange={(v) => edit((d) => void (d.loveStory[i].title = v))} />
              <TextArea label="Nội dung" value={s.text} maxLength={400} onChange={(v) => edit((d) => void (d.loveStory[i].text = v))} />
            </div>
          </div>
        ))}
        {config.loveStory.length < MAX_STORY && (
          <AddButton onClick={() => edit((d) => void d.loveStory.push({ title: "Kỷ niệm mới", text: "", image: "/images/story-1.svg" }))}>Thêm kỷ niệm</AddButton>
        )}
      </Card>

      <Card
        id="album"
        title={`Album cưới (${config.album.length}/${MAX_ALBUM} ảnh)`}
        description="Toàn bộ ảnh nằm trong một sector dài 1,75 màn hình; ảnh đầu tiên được làm nổi bật. Các ảnh đầu tiên cũng được dùng cho trò lật hình."
      >
        <AlbumEditor album={config.album} max={MAX_ALBUM} onChange={(album) => edit((d) => void (d.album = album))} />
      </Card>

      <Card id="mung-cuoi" title="Hộp mừng cưới" description="Khách bấm vào hòm để xem mã QR. Nên dùng ảnh QR xuất từ ứng dụng ngân hàng; chọn ứng dụng ngân hàng để khách bấm vào mã QR là mở thẳng ứng dụng đó.">
        {config.gifts.map((g, i) => (
          <div key={i} className="grid gap-4 rounded-2xl bg-white/70 p-4 ring-1 ring-line sm:grid-cols-[180px_1fr]">
            <ImageField label="Mã QR (vuông)" kind="qr" optional value={g.qr} ratio={1} outSide={1000} onChange={(v) => edit((d) => void (d.gifts[i].qr = v))} />
            <div className="space-y-3">
              <div className="flex justify-end">
                <ItemTools
                  index={i}
                  count={config.gifts.length}
                  onMove={(to) => edit((d) => void (d.gifts = move(d.gifts, i, to)))}
                  onRemove={() => edit((d) => void d.gifts.splice(i, 1))}
                />
              </div>
              <TextField multiline label="Tiêu đề" value={g.title} placeholder="Mừng cưới chú rể" onChange={(v) => edit((d) => void (d.gifts[i].title = v))} />
              <TextField multiline label="Ngân hàng" value={g.bank} onChange={(v) => edit((d) => void (d.gifts[i].bank = v))} />
              <label className="block">
                <span className="label">Mở ứng dụng ngân hàng khi khách bấm vào mã QR</span>
                <select
                  className="field"
                  value={g.bankApp}
                  onChange={(e) =>
                    edit((d) => {
                      d.gifts[i].bankApp = e.target.value;
                      const name = BANK_APPS.find((b) => b.id === e.target.value)?.name;
                      if (name && (!d.gifts[i].bank || d.gifts[i].bank === "Tên ngân hàng")) d.gifts[i].bank = name;
                    })
                  }
                >
                  <option value="">Không (chỉ hiện mã QR)</option>
                  {BANK_APPS.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
                <span className="mt-1 block text-xs text-ink-soft">Bấm vào QR sẽ mở app ngân hàng và chép sẵn số tài khoản. Chỉ VietinBank, BIDV, OCB, ACB, MB tự điền được số tài khoản.</span>
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <TextField label="Số tài khoản" value={g.accountNumber} onChange={(v) => edit((d) => void (d.gifts[i].accountNumber = v))} />
                <TextField multiline label="Chủ tài khoản" value={g.accountName} onChange={(v) => edit((d) => void (d.gifts[i].accountName = v.toUpperCase()))} />
              </div>
            </div>
          </div>
        ))}
        {config.gifts.length < 4 && (
          <AddButton onClick={() => edit((d) => void d.gifts.push({ title: "Mừng cưới", bank: "", accountNumber: "", accountName: "", qr: "", bankApp: "" }))}>Thêm tài khoản</AddButton>
        )}
      </Card>

      <Card id="tro-choi" title="Trò chơi" description="Giải thưởng vòng quay chỉnh ở trang Trò chơi. Đáp án đố vui chỉ lưu trên máy chủ, khách không xem trước được.">
        <div className="grid gap-4 sm:grid-cols-2">
          <NumberField label="Số giây cho mỗi câu đố" value={config.games.quizSeconds} min={5} max={120} onChange={(v) => edit((d) => void (d.games.quizSeconds = v))} />
          <NumberField
            label="Số cặp thẻ trò lật hình"
            value={config.games.memoryPairs}
            min={2}
            max={12}
            hint={`Lấy từ ${config.games.memoryPairs} ảnh đầu của album (album đang có ${config.album.length} ảnh).`}
            onChange={(v) => edit((d) => void (d.games.memoryPairs = v))}
          />
        </div>
        <p className="pt-2 font-semibold">Câu đố ({quiz.length} câu)</p>
        {quiz.map((q, i) => (
          <div key={i} className="space-y-3 rounded-2xl bg-white/70 p-4 ring-1 ring-line">
            <div className="flex items-start gap-3">
              <TextField multiline label={`Câu ${i + 1}`} value={q.question} className="flex-1" onChange={(v) => editQuiz((d) => void (d[i].question = v))} />
              <div className="pt-6">
                <ItemTools index={i} count={quiz.length} onMove={(to) => setQuiz((qs) => move(qs, i, to))} onRemove={() => editQuiz((d) => void d.splice(i, 1))} />
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {q.options.map((opt, j) => (
                <div key={j} className={`flex items-center gap-2 rounded-xl px-2 py-1 ${q.answer === j ? "bg-olive/10 ring-1 ring-olive" : ""}`}>
                  <input
                    type="radio"
                    name={`answer-${i}`}
                    checked={q.answer === j}
                    onChange={() => editQuiz((d) => void (d[i].answer = j))}
                    aria-label={`Đáp án ${String.fromCharCode(65 + j)} là đúng`}
                  />
                  <span className="w-5 text-sm font-semibold text-olive">{String.fromCharCode(65 + j)}.</span>
                  <input className="field !py-1.5" value={opt} onChange={(e) => editQuiz((d) => void (d[i].options[j] = e.target.value))} />
                  {q.options.length > 2 && (
                    <button
                      type="button"
                      className="text-xs text-ink-soft hover:text-[#8a4a3e]"
                      aria-label="Xoá đáp án"
                      onClick={() =>
                        editQuiz((d) => {
                          d[i].options.splice(j, 1);
                          if (d[i].answer >= d[i].options.length) d[i].answer = 0;
                          else if (d[i].answer > j) d[i].answer -= 1;
                        })
                      }
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-3 text-xs text-ink-soft">
              <span>Chấm tròn = đáp án đúng.</span>
              {q.options.length < 6 && (
                <button type="button" className="text-olive-deep underline" onClick={() => editQuiz((d) => void d[i].options.push(""))}>
                  + Thêm đáp án
                </button>
              )}
            </div>
          </div>
        ))}
        <AddButton onClick={() => editQuiz((d) => void d.push({ question: "", options: ["", "", "", ""], answer: 0 }))}>Thêm câu đố</AddButton>
      </Card>

      <Card id="hien-thi" title="Hiển thị các phần" description="Tắt những phần chưa muốn hiện trên thiệp.">
        <div className="grid gap-2 sm:grid-cols-2">
          {(Object.keys(SECTION_LABELS) as SectionKey[]).map((key) => (
            <label key={key} className="flex cursor-pointer items-center gap-3 rounded-xl bg-white/70 px-3 py-2.5 ring-1 ring-line">
              <input type="checkbox" className="h-4 w-4" checked={config.sections[key]} onChange={(e) => edit((d) => void (d.sections[key] = e.target.checked))} />
              {SECTION_LABELS[key]}
            </label>
          ))}
        </div>
      </Card>
        </div>

        <aside
          className={
            previewOpen
              ? "fixed inset-0 z-40 grid place-items-center bg-ink/60 p-4 lg:static lg:block lg:bg-transparent lg:p-0"
              : "hidden lg:block"
          }
        >
          <div className="h-[82dvh] w-full max-w-[400px] rounded-3xl bg-paper p-3 lg:sticky lg:top-28 lg:h-[calc(100dvh-11.5rem)] lg:max-w-none lg:bg-transparent lg:p-0">
            <ConfigPreview config={config} section={section} onClose={() => setPreviewOpen(false)} />
          </div>
        </aside>
      </div>
    </div>
  );
}

const ALBUM_ASPECTS: Aspects = [
  ["Giữ nguyên tỉ lệ", null],
  ["1:1", 1],
  ["3:4", 3 / 4],
  ["4:3", 4 / 3],
  ["16:9", 16 / 9],
];

function AlbumEditor({ album, max, onChange }: { album: string[]; max: number; onChange: (album: string[]) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [queue, setQueue] = useState<File[]>([]); // ảnh đang chờ căn chỉnh, ảnh đầu tiên đang mở hộp thoại
  const [over, setOver] = useState(false);
  const [error, setError] = useState("");
  const added = useRef<string[]>([]); // ảnh đã tải lên trong lượt này
  const [total, setTotal] = useState(0);

  function pickFiles(files: FileList | null) {
    const all = Array.from(files ?? []).filter((f) => f.type.startsWith("image/")); // đọc trước khi xoá ô chọn tệp (FileList bị rỗng theo)
    if (input.current) input.current.value = "";
    if (!all.length) return;
    const room = max - album.length;
    if (room <= 0) return setError(`Chủ đề này đã đủ ${max} ảnh. Hãy xoá bớt hoặc thêm chủ đề mới.`);
    const images = all.slice(0, room);
    setError(images.length < all.length ? `Chỉ nhận thêm ${room} ảnh (tối đa ${max} ảnh mỗi chủ đề).` : "");
    added.current = [];
    setTotal(images.length);
    setQueue(images);
  }

  // Xong (hoặc dừng giữa chừng) thì thêm các ảnh đã tải vào album.
  function finish() {
    if (added.current.length) onChange([...album, ...added.current]);
    added.current = [];
    setQueue([]);
  }

  async function addUploaded(file: Blob) {
    added.current.push(await uploadFile(file, "photo"));
    if (queue.length <= 1) finish();
    else setQueue((q) => q.slice(1));
  }

  // Tải nguyên bản (không cắt) các ảnh còn lại.
  async function uploadRest(files: File[]) {
    for (const f of files) {
      try {
        added.current.push(await uploadFile(f, "photo"));
      } catch (err) {
        setError(`${f.name}: ${(err as Error).message}`);
      }
    }
    finish();
  }

  const current = queue[0];
  const n = total - queue.length + 1;

  return (
    <div
      className={`space-y-3 rounded-2xl ${over ? "ring-2 ring-olive" : ""}`}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        pickFiles(e.dataTransfer.files);
      }}
    >
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-4 xl:grid-cols-6">
        {album.map((src, i) => (
          <div key={`${i}-${src}`} className="group relative aspect-square overflow-hidden rounded-xl bg-paper ring-1 ring-line">
            {/* eslint-disable-next-line @next/next/no-img-element -- xem trước trong trang quản trị */}
            <img src={src} alt={`Ảnh ${i + 1}`} className="h-full w-full object-cover" />
            <span className="absolute left-1 top-1 rounded-full bg-ink/70 px-1.5 text-[10px] text-white">{i + 1}</span>
            <div className="absolute inset-x-1 bottom-1 flex justify-between gap-1">
              <button type="button" disabled={i === 0} onClick={() => onChange(move(album, i, i - 1))} className="h-7 w-7 rounded-lg bg-white/90 text-xs disabled:opacity-30" aria-label="Lên trước">
                ←
              </button>
              <button type="button" onClick={() => onChange(album.filter((_, j) => j !== i))} className="h-7 rounded-lg bg-white/90 px-2 text-xs text-[#8a4a3e]">
                Xoá
              </button>
              <button
                type="button"
                disabled={i === album.length - 1}
                onClick={() => onChange(move(album, i, i + 1))}
                className="h-7 w-7 rounded-lg bg-white/90 text-xs disabled:opacity-30"
                aria-label="Ra sau"
              >
                →
              </button>
            </div>
          </div>
        ))}
      </div>
      <button type="button" onClick={() => input.current?.click()} className="btn btn-primary !py-2 !text-xs">
        Tải thêm ảnh ({album.length}/{max}, chọn hoặc kéo thả nhiều ảnh)
      </button>
      {error && <p className="text-xs text-[#8a4a3e]">{error}</p>}
      <input ref={input} type="file" accept="image/*" multiple className="hidden" onChange={(e) => pickFiles(e.target.files)} />
      {current && (
        <CropDialog
          key={`${n}-${current.name}`}
          file={current}
          spec={{ aspects: ALBUM_ASPECTS, outSide: 2000 }}
          title={total > 1 ? `Căn chỉnh ảnh ${n}/${total}` : "Căn chỉnh ảnh"}
          onCancel={finish}
          onDone={addUploaded}
          onSkip={[
            { label: "Dùng ảnh gốc (không cắt)", run: () => addUploaded(current) },
            ...(queue.length > 1 ? [{ label: `Dùng ảnh gốc cho cả ${queue.length} ảnh còn lại`, run: () => uploadRest(queue) }] : []),
          ]}
        />
      )}
    </div>
  );
}
