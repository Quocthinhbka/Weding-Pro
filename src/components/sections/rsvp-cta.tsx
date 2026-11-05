"use client";

import { formatLucky } from "@/lib/game-logic";
import { useGuest } from "@/components/site/guest";

export function RsvpButton() {
  const { state, openRsvp } = useGuest();
  const rsvp = state?.rsvp;
  return (
    <div>
      <button type="button" onClick={openRsvp} className="btn btn-primary">
        💌 {rsvp ? "Sửa xác nhận tham dự" : "Xác nhận tham dự"}
      </button>
      {rsvp && (
        <div className="mt-3 space-y-0.5 text-sm text-ink-soft">
          {/* Hai hàng riêng: trạng thái xác nhận, rồi số may mắn */}
          <p>{rsvp.attending ? `Bạn đã xác nhận tham dự (${rsvp.partySize} người).` : "Bạn đã báo không tham dự được."}</p>
          {rsvp.luckyNumber && (
            <p>
              Số may mắn: <b className="text-olive-deep">{formatLucky(rsvp.luckyNumber)}</b>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
