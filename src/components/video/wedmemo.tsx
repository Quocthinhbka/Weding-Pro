"use client";

import { useEffect, useMemo, useRef } from "react";
import { useWedding } from "@/components/site/wedding-context";
import { coupleOrder, dateInfo, type Side } from "@/content/wedding";
import { startWedMemo, type WedMemoConfig } from "./wedmemo-engine";
import "./wedmemo.css";

/**
 * Ghi và xem video lời chúc (dựng từ dự án WedMemo), nằm ngay trong thiệp.
 * `kiosk` = máy ở sảnh tiệc: toàn màn hình, có màn hình chào kèm mã QR, tự về màn hình chào sau 90 giây không ai chạm.
 * Phần giao diện chỉ là khung HTML tĩnh; toàn bộ hoạt động do wedmemo-engine điều khiển trực tiếp trên DOM.
 */
export function WedMemo({ kiosk = false, side = "groom" }: { kiosk?: boolean; side?: Side }) {
  const root = useRef<HTMLDivElement>(null);
  const engine = useRef<ReturnType<typeof startWedMemo> | null>(null);
  const config = useWedding();
  const cfg = useMemo<WedMemoConfig>(
    () => ({ groom: coupleOrder(config, side)[0].person.name, bride: coupleOrder(config, side)[1].person.name, date: dateInfo(config).dots.replaceAll(".", " · "), title: "Gửi lời chúc đến", frame: "gold", max_minutes: 5 }),
    [config, side],
  );
  const latest = useRef(cfg);

  useEffect(() => {
    latest.current = cfg;
    engine.current?.setCfg(cfg);
  }, [cfg]);

  useEffect(() => {
    engine.current = startWedMemo(root.current!, { kiosk, cfg: latest.current });
    return () => {
      engine.current?.destroy();
      engine.current = null;
    };
  }, [kiosk]);

  return (
    <div ref={root} className={`wm ${kiosk ? "wm-kiosk" : "wm-embed"}`}>
      {/* Chữ 囍 của khung "Đỏ song hỷ" */}
      {/* eslint-disable-next-line @next/next/no-page-custom-font -- chỉ một ký tự, nạp khi cần */}
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@700&text=%E5%9B%8D&display=swap" precedence="default" />

      {/* Thẻ mở đầu: bấm "Bắt đầu" mới hiện hộp thoại camera */}
      <div className="wm-start">
        <p className="wm-eyebrow" id="sTitle" />
        <div className="wm-names" id="sNames" />
        <p className="wm-date" id="sDate" />
        <p className="wm-lead">Hãy để lại một lời chúc bằng video cho cô dâu chú rể nhé! 💕</p>
        <button type="button" className="wm-btn wm-big" id="startBtn">
          🎥 Bắt đầu ghi lời chúc
        </button>
        <div className="wm-qr">
          {/* eslint-disable-next-line @next/next/no-img-element -- mã QR tĩnh nhỏ */}
          <img src="/images/qr-video.svg" alt="Mã QR" />
          <span>
            Quét mã để ghi bằng
            <br />
            điện thoại của bạn
          </span>
        </div>
      </div>

      {/* Hộp thoại camera: xem trước kèm khung đã chọn, nút quay đỏ có đếm ngược và vòng tiến trình */}
      <dialog id="cam" className="wm-cam">
        <div className="wm-cam-head">
          <b>Ghi lời chúc</b>
          <button type="button" className="wm-pill" id="flip" title="Đổi camera trước/sau" hidden>
            🔄
          </button>
          <button type="button" className="wm-pill" id="camClose" aria-label="Đóng">
            ✕
          </button>
        </div>
        <div className="wm-stage" id="stage">
          <div className="wm-cvwrap" id="cvwrap">
            <canvas id="cv" width={720} height={960} />
            <div className="wm-count" id="count" hidden />
          </div>
          <div className="wm-camerr" id="camErr" hidden>
            <p id="camErrMsg" />
            <button type="button" className="wm-btn" id="retry">
              Thử lại
            </button>
          </div>
        </div>
        <section className="wm-ctrl">
          <p className="wm-hint" id="hint" />
          <div className="wm-seg wm-durs" id="durs">
            <button type="button" data-d="15">
              15s
            </button>
            <button type="button" data-d="30" className="on">
              30s
            </button>
            <button type="button" data-d="60">
              60s
            </button>
            <button type="button" data-d="0">
              Tối đa
            </button>
          </div>
          <div className="wm-opts">
            <div className="wm-seg privs">
              <button type="button" data-p="0" className="on">
                🌐 Công khai
              </button>
              <button type="button" data-p="1">
                🔒 Riêng tư
              </button>
            </div>
            <button type="button" className="wm-pill" id="frameBtn">
              🎨 Khung
            </button>
          </div>
          <div className="wm-rw">
            <svg viewBox="0 0 84 84" aria-hidden>
              <circle cx="42" cy="42" r="38" fill="none" stroke="var(--line)" strokeWidth="4" />
              <circle id="ring" cx="42" cy="42" r="38" fill="none" stroke="var(--rose)" strokeWidth="4" strokeLinecap="round" strokeDasharray="238.76" strokeDashoffset="238.76" />
            </svg>
            <button type="button" id="rec" aria-label="Bắt đầu / dừng ghi hình">
              <span id="recTime" />
            </button>
          </div>
        </section>
      </dialog>

      <section className="wm-thumbs" aria-label="Lời chúc video">
        <div className="wm-thumbs-head">
          <h4>
            Lời chúc video <b id="gcount" />
          </h4>
          <span className="wm-pill wm-up" id="up" hidden />
          <button type="button" className="wm-pill" id="lockBtn">
            🔓 Mở khoá
          </button>
        </div>
        <div className="wm-grid" id="grid" />
        <p className="wm-empty" id="empty" hidden>
          Chưa có lời chúc video nào. Hãy là người đầu tiên! 💕
        </p>
      </section>

      <div className="wm-fsguard" id="fsguard" hidden>
        Chạm vào màn hình để tiếp tục 💕
      </div>

      <dialog id="review">
        <video id="rv" controls playsInline />
        <label>
          Tên của bạn <span className="wm-muted">(không bắt buộc)</span>
          <input className="wm-input" id="guest" maxLength={60} placeholder="VD: Cô Ba bên nội" autoComplete="off" />
        </label>
        <div className="wm-seg privs">
          <button type="button" data-p="0" className="on">
            🌐 Công khai
          </button>
          <button type="button" data-p="1">
            🔒 Riêng tư
          </button>
        </div>
        <p className="wm-muted" id="privNote" />
        <div className="wm-row">
          <button type="button" className="wm-btn wm-ghost" id="again">
            ↺ Ghi lại
          </button>
          <button type="button" className="wm-btn" id="send">
            💌 Gửi lời chúc
          </button>
        </div>
      </dialog>

      <dialog id="frames">
        <div className="wm-ghead wm-flat">
          <h3>Chọn khung</h3>
          <button type="button" className="wm-pill" data-close>
            ✕ Đóng
          </button>
        </div>
        <div className="wm-fgrid" id="fgrid" />
      </dialog>

      <dialog id="pin">
        <h3>🔒 Clip riêng tư</h3>
        <p className="wm-muted">Nhập mã 4 số để xem các clip riêng tư.</p>
        <input id="code" className="wm-code" inputMode="numeric" maxLength={4} autoComplete="off" placeholder="····" />
        <p className="wm-err" id="err" />
        <div className="wm-row">
          <button type="button" className="wm-btn wm-ghost" data-close>
            Huỷ
          </button>
          <button type="button" className="wm-btn" id="unlock">
            Mở khoá
          </button>
        </div>
      </dialog>

      <dialog id="player">
        <video id="pv" controls playsInline />
        <div className="wm-prow">
          <b id="pname" />
          <div className="wm-muted" id="pmeta" />
        </div>
        <div className="wm-row">
          <button type="button" className="wm-btn wm-danger" id="del" hidden>
            🗑 Xoá
          </button>
          <button type="button" className="wm-btn wm-ghost" id="prev">
            ‹ Trước
          </button>
          <button type="button" className="wm-btn wm-ghost" id="next">
            Sau ›
          </button>
          <button type="button" className="wm-btn" data-close>
            Đóng
          </button>
        </div>
      </dialog>

      <div className="wm-toast" id="toast" popover="manual" hidden />
    </div>
  );
}
