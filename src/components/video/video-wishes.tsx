"use client";

import { useState } from "react";
import type { Video } from "@/lib/queries";
import { useMusic } from "@/components/site/music";
import { Daisy } from "@/components/ui/daisy";
import { Modal } from "@/components/ui/modal";
import { SectionTitle } from "@/components/ui/section-title";
import { VideoRecorder } from "./video-recorder";

type PublicVideo = Pick<Video, "id" | "name" | "message" | "poster" | "created_at">;

export function VideoWishes({ videos }: { videos: PublicVideo[] }) {
  const { playing, toggle } = useMusic();
  const [recording, setRecording] = useState(false);
  const [watching, setWatching] = useState<PublicVideo | null>(null);
  const [resumeMusic, setResumeMusic] = useState(false);

  function watch(v: PublicVideo) {
    if (playing) {
      toggle();
      setResumeMusic(true);
    }
    setWatching(v);
  }

  function closeVideo() {
    setWatching(null);
    if (resumeMusic) {
      toggle();
      setResumeMusic(false);
    }
  }

  return (
    <section className="bg-paper/60 px-6 py-16">
      <SectionTitle eyebrow="Video Wishes" title="Video chúc mừng" subtitle="Gửi tới cô dâu chú rể một lời chúc bằng chính giọng nói và nụ cười của bạn!" />
      <div className="text-center">
        <button type="button" onClick={() => setRecording(true)} className="btn btn-primary">
          🎥 Quay video chúc mừng
        </button>
      </div>

      {videos.length > 0 && (
        <div className="mt-8 grid grid-cols-2 gap-3">
          {videos.map((v) => (
            <button key={v.id} type="button" onClick={() => watch(v)} className="group relative aspect-[3/4] overflow-hidden rounded-2xl bg-ink text-left ring-1 ring-line">
              {v.poster ? (
                // eslint-disable-next-line @next/next/no-img-element -- ảnh bìa video phục vụ qua API riêng
                <img src={`/api/videos/${v.id}/poster`} alt="" className="h-full w-full object-cover opacity-90 transition group-hover:scale-105" loading="lazy" />
              ) : (
                <div className="grid h-full place-items-center bg-olive/80">
                  <Daisy size={48} />
                </div>
              )}
              <span className="absolute left-1/2 top-1/2 grid h-12 w-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/85 pl-1 text-lg text-ink">▶</span>
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 pt-8 text-sm font-medium text-white">{v.name}</span>
            </button>
          ))}
        </div>
      )}

      <Modal open={recording} onClose={() => setRecording(false)} title="Quay video chúc mừng">
        <VideoRecorder />
      </Modal>

      <Modal open={!!watching} onClose={closeVideo} title={watching ? `Lời chúc từ ${watching.name}` : undefined}>
        {watching && (
          <>
            <video src={`/api/videos/${watching.id}/file`} controls autoPlay playsInline className="max-h-[65dvh] w-full rounded-2xl bg-ink" />
            {watching.message && <p className="mt-3 text-sm italic text-ink-soft">“{watching.message}”</p>}
          </>
        )}
      </Modal>
    </section>
  );
}
