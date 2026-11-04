import type { ReactNode } from "react";
import { CalendarMonth } from "@/components/sections/calendar";
import { Countdown } from "@/components/sections/countdown";
import { GamesTeaser } from "@/components/sections/games-teaser";
import { GiftBox, ThankYou } from "@/components/sections/gift-thanks";
import { Guestbook } from "@/components/sections/guestbook";
import { Couple, Family, Hero, IntroMusic } from "@/components/sections/intro";
import { Schedule } from "@/components/sections/schedule";
import { Album, LoveStory } from "@/components/sections/story-album";
import { VideoWishes } from "@/components/sections/video-wishes";
import type { WeddingConfig } from "@/content/wedding";
import type { Wish } from "@/lib/queries";

const Sec = ({ id, children }: { id: string; children: ReactNode }) => <div data-sec={id}>{children}</div>;

/** Toàn bộ các phần của thiệp, dùng chung cho trang chủ và khung xem trước trong trang cấu hình. */
export function SiteSections({ config, wishes }: { config: WeddingConfig; wishes: Wish[] }) {
  const show = config.sections;
  return (
    <>
      <Sec id="hero"><Hero config={config} /></Sec>
      {show.music && <Sec id="music"><IntroMusic /></Sec>}
      <Sec id="family"><Family config={config} /></Sec>
      <Sec id="couple"><Couple config={config} /></Sec>
      <Sec id="countdown"><Countdown /></Sec>
      <Sec id="calendar"><CalendarMonth config={config} /></Sec>
      <Sec id="schedule"><Schedule config={config} /></Sec>
      {show.loveStory && config.loveStory.length > 0 && <Sec id="story"><LoveStory config={config} /></Sec>}
      {show.album && config.album.length > 0 && <Sec id="album"><Album config={config} /></Sec>}
      {show.guestbook && <Sec id="guestbook"><Guestbook initial={wishes} /></Sec>}
      {show.video && <Sec id="video"><VideoWishes /></Sec>}
      {show.games && <Sec id="games"><GamesTeaser /></Sec>}
      {show.gifts && config.gifts.length > 0 && <Sec id="gifts"><GiftBox /></Sec>}
      <Sec id="thanks"><ThankYou /></Sec>
    </>
  );
}
