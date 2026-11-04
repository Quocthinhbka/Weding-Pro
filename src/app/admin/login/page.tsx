"use client";

import { useActionState } from "react";
import { Daisy } from "@/components/ui/daisy";
import { login } from "../actions";

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, undefined);
  return (
    <div className="paper-bg grid min-h-dvh place-items-center px-4">
      <form action={action} className="w-full max-w-sm space-y-4 rounded-3xl bg-cream p-8 shadow-xl ring-1 ring-line">
        <Daisy size={40} className="mx-auto" />
        <h1 className="text-center font-serif text-2xl font-semibold">Quản trị thiệp cưới</h1>
        <p className="text-center text-sm text-ink-soft">Nhập mã quản trị để cấu hình thiệp</p>
        <input
          name="password"
          type="password"
          inputMode="numeric"
          autoComplete="current-password"
          className="field text-center text-2xl tracking-[0.4em]"
          placeholder="••••••••"
          aria-label="Mã quản trị"
          autoFocus
          required
        />
        {state?.error && <p className="text-center text-sm text-[#8a4a3e]">{state.error}</p>}
        <button className="btn btn-primary w-full" disabled={pending}>
          {pending ? "Đang kiểm tra…" : "Đăng nhập"}
        </button>
      </form>
    </div>
  );
}
