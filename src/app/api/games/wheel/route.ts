import { currentGuest } from "@/lib/guest";
import { guestState, luckyWinners, wheelPrizesPublic } from "@/lib/queries";

export async function GET() {
  return Response.json({ prizes: wheelPrizesPublic(), winners: luckyWinners(), ...guestState(await currentGuest()) });
}
