"use client";

import { useEffect, useRef, useState } from "react";
import { useGuest } from "@/components/site/guest";

const MAX_SECONDS = 60;
const MAX_BYTES = 80 * 1024 * 1024;

type Phase = "idle" | "starting" | "live" | "recording" | "review" | "uploading" | "done";

function pickMime() {
  const candidates = ["video/mp4;codecs=avc1.42E01E,mp4a.40.2", "video/mp4", "video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"];
  return candidates.find((c) => MediaRecorder.isTypeSupported(c)) ?? "";
}

function canRecord() {
  return typeof window !== "undefined" && !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== "undefined";
}

export function VideoRecorder({ onUploaded }: { onUploaded?: () => void }) {
  const { state } = useGuest();
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState("");
  const [seconds, setSeconds] = useState(0);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [name, setName] = useState(state?.rsvp?.name ?? state?.guest?.name ?? "");
  const [message, setMessage] = useState("");
  const [supported, setSupported] = useState(true);

  const liveRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setSupported(canRecord()), 0);
    return () => {
      clearTimeout(t);
      stopStream();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function stopStream() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  async function startCamera() {
    setError("");
    setPhase("starting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 720 }, height: { ideal: 1280 } },
        audio: true,
      });
      streamRef.current = stream;
      setPhase("live");
      requestAnimationFrame(() => {
        if (liveRef.current) {
          liveRef.current.srcObject = stream;
          liveRef.current.play().catch(() => {});
        }
      });
    } catch {
      setPhase("idle");
      setError("Không mở được camera. Hãy cho phép trình duyệt dùng camera và micro, hoặc chọn video có sẵn bên dưới.");
    }
  }

  function startRecording() {
    const stream = streamRef.current;
    if (!stream) return;
    const mimeType = pickMime();
    const recorder = new MediaRecorder(stream, { ...(mimeType ? { mimeType } : {}), videoBitsPerSecond: 2_000_000 });
    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    recorder.onstop = () => {
      const type = (recorder.mimeType || mimeType || "video/webm").split(";")[0];
      const result = new Blob(chunks, { type });
      setBlob(result);
      setPreviewUrl(URL.createObjectURL(result));
      setPhase("review");
      stopStream();
    };
    recorderRef.current = recorder;
    recorder.start(1000);
    setSeconds(0);
    setPhase("recording");
    timerRef.current = setInterval(() => {
      setSeconds((s) => {
        if (s + 1 >= MAX_SECONDS) stopRecording();
        return s + 1;
      });
    }, 1000);
  }

  function stopRecording() {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
  }

  function pickFile(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("video/")) return setError("Vui lòng chọn một tệp video.");
    if (file.size > MAX_BYTES) return setError("Video quá lớn (tối đa 80MB). Bạn hãy quay ngắn hơn nhé!");
    setError("");
    stopStream();
    setBlob(file);
    setPreviewUrl(URL.createObjectURL(file));
    setPhase("review");
  }

  function reset() {
    setBlob(null);
    setPreviewUrl(null);
    setSeconds(0);
    setPhase("idle");
  }

  function upload() {
    if (!blob) return;
    if (!name.trim()) return setError("Vui lòng nhập tên của bạn.");
    setError("");
    setPhase("uploading");
    setProgress(0);
    const params = new URLSearchParams({ name: name.trim(), message: message.trim() });
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `/api/videos?${params}`);
    xhr.setRequestHeader("Content-Type", blob.type || "video/mp4");
    xhr.upload.onprogress = (e) => e.lengthComputable && setProgress(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        setPhase("done");
        onUploaded?.();
      } else {
        let msg = "Gửi video thất bại, vui lòng thử lại.";
        try {
          msg = JSON.parse(xhr.responseText).error || msg;
        } catch {}
        setError(msg);
        setPhase("review");
      }
    };
    xhr.onerror = () => {
      setError("Mất kết nối khi gửi video, vui lòng thử lại.");
      setPhase("review");
    };
    xhr.send(blob);
  }

  if (phase === "done") {
    return (
      <div className="py-8 text-center">
        <p className="font-script text-4xl text-olive">Cảm ơn bạn!</p>
        <p className="mt-3 text-sm text-ink-soft">Video lời chúc đã được gửi tới cô dâu chú rể. 💛</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {(phase === "live" || phase === "recording" || phase === "starting") && (
        <div className="relative overflow-hidden rounded-2xl bg-ink">
          <video ref={liveRef} muted playsInline className="aspect-[3/4] w-full -scale-x-100 object-cover" />
          {phase === "recording" && (
            <div className="absolute left-3 top-3 flex items-center gap-2 rounded-full bg-black/55 px-3 py-1 text-sm text-white">
              <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-500" />
              {String(Math.floor(seconds / 60)).padStart(2, "0")}:{String(seconds % 60).padStart(2, "0")} / 01:00
            </div>
          )}
          <div className="absolute inset-x-0 bottom-4 flex justify-center">
            {phase === "live" && (
              <button type="button" onClick={startRecording} aria-label="Bắt đầu quay" className="grid h-16 w-16 place-items-center rounded-full border-4 border-white/90">
                <span className="h-11 w-11 rounded-full bg-red-500" />
              </button>
            )}
            {phase === "recording" && (
              <button type="button" onClick={stopRecording} aria-label="Dừng quay" className="grid h-16 w-16 place-items-center rounded-full border-4 border-white/90">
                <span className="h-7 w-7 rounded-md bg-red-500" />
              </button>
            )}
          </div>
        </div>
      )}

      {(phase === "review" || phase === "uploading") && previewUrl && (
        <video src={previewUrl} controls playsInline className="aspect-[3/4] w-full rounded-2xl bg-ink object-contain" />
      )}

      {phase === "idle" && (
        <div className="rounded-2xl bg-paper p-5 text-center text-sm leading-relaxed text-ink-soft">
          Quay một đoạn video ngắn (tối đa 1 phút) gửi lời chúc tới cô dâu chú rể nhé! Video chỉ hiện công khai khi cô dâu chú rể đồng ý.
        </div>
      )}

      {error && <p className="rounded-xl bg-rose/15 px-3 py-2 text-sm text-[#8a4a3e]">{error}</p>}

      {phase === "idle" && (
        <div className="grid gap-2">
          {supported && (
            <button type="button" onClick={startCamera} className="btn btn-primary">
              🎥 Mở camera
            </button>
          )}
          <button type="button" onClick={() => fileRef.current?.click()} className="btn btn-outline">
            {supported ? "Chọn video có sẵn" : "🎥 Quay / chọn video"}
          </button>
          <input ref={fileRef} type="file" accept="video/*" capture="user" className="hidden" onChange={(e) => pickFile(e.target.files?.[0])} />
        </div>
      )}

      {(phase === "review" || phase === "uploading") && (
        <div className="space-y-3">
          <input className="field" placeholder="Tên của bạn *" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
          <input className="field" placeholder="Lời nhắn kèm theo (không bắt buộc)" value={message} onChange={(e) => setMessage(e.target.value)} maxLength={300} />
          {phase === "uploading" ? (
            <div className="space-y-2">
              <div className="h-2 overflow-hidden rounded-full bg-paper-deep">
                <div className="h-full bg-olive transition-all" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-center text-sm text-ink-soft">Đang gửi… {progress}%</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={reset} className="btn btn-outline">
                Quay lại
              </button>
              <button type="button" onClick={upload} className="btn btn-primary">
                Gửi video
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
