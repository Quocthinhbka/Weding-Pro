import { publicConfig } from "@/lib/wedmemo";

export function GET() {
  return Response.json(publicConfig(), { headers: { "Cache-Control": "no-cache" } });
}
