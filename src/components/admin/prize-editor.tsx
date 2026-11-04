"use client";

import { useState, useTransition } from "react";
import { savePrizes, type PrizeInput } from "@/app/admin/actions";

export function PrizeEditor({ initial }: { initial: PrizeInput[] }) {
  const [rows, setRows] = useState(initial);
  const [message, setMessage] = useState("");
  const [pending, start] = useTransition();

  const update = (i: number, patch: Partial<PrizeInput>) => setRows((r) => r.map((row, j) => (j === i ? { ...row, ...patch } : row)));
  const totalWeight = rows.reduce((s, r) => s + (Number(r.weight) || 0), 0);

  return (
    <div className="space-y-3 rounded-2xl bg-cream p-4 ring-1 ring-line">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="text-left text-ink-soft">
            <tr>
              <th className="py-1 pr-2">Màu</th>
              <th className="py-1 pr-2">Tên ô</th>
              <th className="py-1 pr-2">Trọng số</th>
              <th className="py-1 pr-2">Tỉ lệ</th>
              <th className="py-1 pr-2">Số lượng còn</th>
              <th className="py-1 pr-2">Là quà?</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td className="py-1 pr-2">
                  <input type="color" value={r.color} onChange={(e) => update(i, { color: e.target.value })} className="h-9 w-12 rounded" />
                </td>
                <td className="py-1 pr-2">
                  <input className="field !py-1.5" value={r.label} maxLength={40} onChange={(e) => update(i, { label: e.target.value })} />
                </td>
                <td className="py-1 pr-2">
                  <input className="field !w-20 !py-1.5" type="number" min={0} value={r.weight} onChange={(e) => update(i, { weight: Number(e.target.value) })} />
                </td>
                <td className="py-1 pr-2 text-ink-soft">{totalWeight ? `${((r.weight / totalWeight) * 100).toFixed(1)}%` : "–"}</td>
                <td className="py-1 pr-2">
                  <input
                    className="field !w-24 !py-1.5"
                    type="number"
                    min={0}
                    placeholder="∞"
                    value={r.stock ?? ""}
                    onChange={(e) => update(i, { stock: e.target.value === "" ? null : Number(e.target.value) })}
                  />
                </td>
                <td className="py-1 pr-2">
                  <input type="checkbox" checked={r.isWin} onChange={(e) => update(i, { isWin: e.target.checked })} className="h-4 w-4" />
                </td>
                <td className="py-1">
                  <button type="button" onClick={() => setRows((rs) => rs.filter((_, j) => j !== i))} className="text-xs text-ink-soft hover:text-ink">
                    Xoá
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="btn btn-outline !py-2 !text-xs"
          onClick={() => setRows((r) => [...r, { label: "Giải mới", color: "#F2C14E", weight: 10, stock: null, isWin: true }])}
        >
          + Thêm ô
        </button>
        <button
          type="button"
          className="btn btn-primary !py-2 !text-xs"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const res = await savePrizes(rows);
              setMessage("error" in res && res.error ? res.error : "Đã lưu ✓");
            })
          }
        >
          {pending ? "Đang lưu…" : "Lưu vòng quay"}
        </button>
        {message && <span className="text-sm text-olive-deep">{message}</span>}
      </div>
    </div>
  );
}
