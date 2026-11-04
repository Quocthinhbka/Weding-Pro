"use client";

import { useState, useTransition } from "react";
import { createInvites } from "@/app/admin/actions";

export function InviteForm() {
  const [text, setText] = useState("");
  const [side, setSide] = useState("");
  const [message, setMessage] = useState("");
  const [pending, start] = useTransition();

  return (
    <form
      className="space-y-3 rounded-2xl bg-cream p-4 ring-1 ring-line"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const n = await createInvites(text, side);
          setText("");
          setMessage(`Đã tạo ${n} lời mời.`);
        });
      }}
    >
      <label className="label" htmlFor="invite-names">
        Thêm khách mời – mỗi dòng một tên (VD: “Anh Nam & gia đình”, “Chị Hoa”)
      </label>
      <textarea id="invite-names" className="field min-h-28" value={text} onChange={(e) => setText(e.target.value)} required />
      <div className="flex flex-wrap items-center gap-3">
        <select className="field !w-auto" value={side} onChange={(e) => setSide(e.target.value)}>
          <option value="">Bên (không bắt buộc)</option>
          <option value="trai">Khách nhà trai</option>
          <option value="gai">Khách nhà gái</option>
        </select>
        <button className="btn btn-primary" disabled={pending}>
          {pending ? "Đang tạo…" : "Tạo link mời"}
        </button>
        {message && <span className="text-sm text-olive-deep">{message}</span>}
      </div>
    </form>
  );
}
