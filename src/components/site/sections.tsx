import type { ReactNode } from "react";
import { CalendarMonth } from "@/components/sections/calendar";
import { Countdown } from "@/components/sections/countdown";
import { GamesTeaser } from "@/components/sections/games-teaser";
import { GiftBox, ThankYou } from "@/components/sections/gift-thanks";
import { Guestbook } from "@/components/sections/guestbook";
import { Family, Hero, HouseOfCouple, InviteCard } from "@/components/sections/intro";
import { MusicCard } from "@/components/sections/music-card";
import { Schedule } from "@/components/sections/schedule";
import { Album, LoveStory } from "@/components/sections/story-album";
import { VideoWishes } from "@/components/sections/video-wishes";
import { Sector } from "@/components/ui/sector";
import type { Side, WeddingConfig } from "@/content/wedding";
import type { PublicWish } from "@/lib/queries";
import { SnapScroller } from "./snap-scroller";

type Item = { id: string; node: ReactNode; tone?: "paper"; screens?: number; flush?: boolean };

/**
 * Các sector của thiệp theo thứ tự, dùng chung cho trang chủ và khung xem trước trong trang cấu hình.
 * Mỗi sector trọn một màn hình; câu chuyện tình yêu và album dài 1,75 màn hình.
 * `side` là bên mời (?f=groom | bride): đổi sự kiện, giờ, địa điểm và chỉ đường ở thẻ mời.
 */
export function SiteSections({ config, wishes, side = "groom" }: { config: WeddingConfig; wishes: PublicWish[]; side?: Side }) {
  const show = config.sections;

  const items: Item[] = [
    { id: "hero", node: <Hero config={config} />, flush: true },
    { id: "family", node: <Family config={config} side={side} /> },
    {
      id: "couple",
      node: (
        <>
          <HouseOfCouple config={config} />
          {show.music && <div className="mt-4 shrink-0"><MusicCard /></div>}
        </>
      ),
      tone: "paper",
    },
    { id: "invite", node: <InviteCard config={config} side={side} /> },
    {
      id: "countdown",
      node: (
        <>
          <Countdown />
          <div className="mt-4">
            <CalendarMonth config={config} />
          </div>
        </>
      ),
      tone: "paper",
    },
    { id: "schedule", node: <Schedule config={config} />, tone: "paper" },
    ...(show.loveStory && config.loveStory.length > 0 ? [{ id: "story", node: <LoveStory config={config} />, screens: 1.75 }] : []),
    ...(show.album && config.album.length > 0 ? [{ id: "album", node: <Album config={config} />, tone: "paper" as const, screens: 1.75 }] : []),
    ...(show.guestbook ? [{ id: "guestbook", node: <Guestbook initial={wishes} /> }] : []),
    ...(show.video ? [{ id: "video", node: <VideoWishes />, tone: "paper" as const }] : []),
    ...(show.games ? [{ id: "games", node: <GamesTeaser />, tone: "paper" as const }] : []),
    ...(show.gifts && config.gifts.length > 0 ? [{ id: "gifts", node: <GiftBox /> }] : []),
    { id: "thanks", node: <ThankYou />, tone: "paper" },
  ];

  return (
    <SnapScroller ids={items.map((i) => i.id)}>
      {items.map(({ id, node, ...rest }) => (
        <Sector key={id} id={id} {...rest}>
          {node}
        </Sector>
      ))}
    </SnapScroller>
  );
}
