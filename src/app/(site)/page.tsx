import { Envelope } from "@/components/site/envelope";
import { CalendarMonth } from "@/components/sections/calendar";
import { Countdown } from "@/components/sections/countdown";
import { GamesTeaser } from "@/components/sections/games-teaser";
import { GiftBox, ThankYou } from "@/components/sections/gift-thanks";
import { Guestbook } from "@/components/sections/guestbook";
import { Couple, Family, Hero, IntroMusic } from "@/components/sections/intro";
import { Schedule } from "@/components/sections/schedule";
import { Album, LoveStory } from "@/components/sections/story-album";
import { VideoWishes } from "@/components/video/video-wishes";
import { getConfig } from "@/lib/config";
import { findInvite } from "@/lib/guest";
import { publicVideos, visibleWishes } from "@/lib/queries";

export default async function Home(props: PageProps<"/">) {
  const sp = await props.searchParams;
  const code = typeof sp.k === "string" ? sp.k : undefined;
  const to = typeof sp.to === "string" ? sp.to.trim().slice(0, 80) : undefined;
  const guestName = findInvite(code)?.display_name ?? (to || null);
  const config = getConfig();
  const show = config.sections;

  return (
    <>
      <Envelope guestName={guestName} />
      <Hero config={config} />
      {show.music && <IntroMusic />}
      <Family config={config} />
      <Couple config={config} />
      <Countdown />
      <CalendarMonth config={config} />
      <Schedule config={config} />
      {show.loveStory && config.loveStory.length > 0 && <LoveStory config={config} />}
      {show.album && config.album.length > 0 && <Album config={config} />}
      {show.guestbook && <Guestbook initial={visibleWishes()} />}
      {show.video && <VideoWishes videos={publicVideos()} />}
      {show.games && <GamesTeaser />}
      {show.gifts && config.gifts.length > 0 && <GiftBox />}
      <ThankYou />
    </>
  );
}
