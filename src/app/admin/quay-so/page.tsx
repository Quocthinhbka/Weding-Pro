import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DrawScreen } from "@/components/admin/draw-screen";
import { isAdmin } from "@/lib/auth";
import { coupleNames, rsvpGroups } from "@/content/wedding";
import { getConfig } from "@/lib/config";
import { all, get } from "@/lib/db";

export const metadata: Metadata = { title: "Bốc số may mắn" };

export default async function DrawPage() {
  if (!(await isAdmin())) redirect("/admin/login");
  const draws = all<{ id: number; lucky_number: number; name: string; drawn_at: number }>(
    "SELECT id, lucky_number, name, drawn_at FROM draws ORDER BY drawn_at DESC",
  );
  const max = get<{ n: number | null }>("SELECT MAX(lucky_number) AS n FROM rsvps")!.n ?? 0;
  const config = getConfig();
  return <DrawScreen draws={draws} maxNumber={max} groups={rsvpGroups(config)} title={coupleNames(config)} />;
}
