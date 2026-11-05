import { Envelope } from "@/components/site/envelope";
import { SiteSections } from "@/components/site/sections";
import { sideFromParam } from "@/content/wedding";
import { getConfig, getQuiz } from "@/lib/config";
import { findInvite } from "@/lib/guest";
import { albumRatios } from "@/lib/media";
import { visibleWishes } from "@/lib/queries";

export default async function Home(props: PageProps<"/">) {
  const sp = await props.searchParams;
  const code = typeof sp.k === "string" ? sp.k : undefined;
  const to = typeof sp.to === "string" ? sp.to.trim().slice(0, 80) : undefined;
  const guestName = findInvite(code)?.display_name ?? (to || null);
  const config = getConfig();
  const side = sideFromParam(sp.f);

  return (
    <>
      <Envelope guestName={guestName} side={side} />
      <SiteSections config={config} wishes={visibleWishes()} side={side} quizTotal={getQuiz().length} albumRatios={await albumRatios(config.album)} />
    </>
  );
}
