import { currentGuest } from "@/lib/guest";
import { guestState, wheelPrizesPublic } from "@/lib/queries";

export async function GET() {
  return Response.json({ prizes: wheelPrizesPublic(), ...guestState(await currentGuest()) });
}
