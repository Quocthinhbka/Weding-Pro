import { getConfig } from "@/lib/config";
import { buildIcs, eventsForVenue } from "@/lib/ics";

export async function GET(_req: Request, ctx: RouteContext<"/api/ics/[venue]">) {
  const { venue } = await ctx.params;
  const config = getConfig();
  if (venue !== "all" && !config.venues.some((v) => v.id === venue)) {
    return new Response("Không tìm thấy", { status: 404 });
  }
  const body = buildIcs(config, eventsForVenue(config, venue));
  return new Response(body, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="dam-cuoi-${venue}.ics"`,
    },
  });
}
