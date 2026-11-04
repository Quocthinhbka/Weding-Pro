import type { ReactNode } from "react";
import { CalendarMonth } from "@/components/sections/calendar";
import { Countdown } from "@/components/sections/countdown";
import { GamesTeaser } from "@/components/sections/games-teaser";
import { GiftBox, ThankYou } from "@/components/sections/gift-thanks";
import { Guestbook } from "@/components/sections/guestbook";
import { Family, Hero, IntroMusic, InviteCard, Portraits } from "@/components/sections/intro";
import { scheduleVenues, VenueCard } from "@/components/sections/schedule";
import { AlbumThemeView, LoveStory } from "@/components/sections/story-album";
import { VideoWishes } from "@/components/sections/video-wishes";
import { Sector } from "@/components/ui/sector";
import type { WeddingConfig } from "@/content/wedding";
import type { Wish } from "@/lib/queries";
import { SnapScroller } from "./snap-scroller";

type Item = { id: string; node: ReactNode; tone?: "paper"; screens?: number; flush?: boolean };

/**
 * Các sector của thiệp theo thứ tự, dùng chung cho trang chủ và khung xem trước trong trang cấu hình.
 * Mỗi sector trọn một màn hình; câu chuyện tình yêu và từng chủ đề album dài 1,75 màn hình.
 */
export function SiteSections({ config, wishes }: { config: WeddingConfig; wishes: Wish[] }) {
  const show = config.sections;
  const venues = scheduleVenues(config);
  const themes = config.album.filter((t) => t.images.length > 0);

  const items: Item[] = [
    { id: "hero", node: <Hero config={config} />, flush: true },
    { id: "family", node: <Family config={config} /> },
    { id: "couple", node: <Portraits config={config} />, tone: "paper" },
    { id: "invite", node: <InviteCard config={config} /> },
    {
      id: "countdown",
      node: (
        <>
          {show.music && <IntroMusic />}
          <Countdown />
        </>
      ),
    },
    { id: "calendar", node: <CalendarMonth config={config} />, tone: "paper" },
    ...venues.map((v, i) => ({
      id: i === 0 ? "schedule" : `schedule-${i + 1}`,
      node: <VenueCard config={config} {...v} index={i} total={venues.length} />,
    })),
    ...(show.loveStory && config.loveStory.length > 0 ? [{ id: "story", node: <LoveStory config={config} />, screens: 1.75 }] : []),
    ...(show.album
      ? themes.map((t, i) => ({
          id: i === 0 ? "album" : `album-${i + 1}`,
          node: <AlbumThemeView theme={t} index={i} total={themes.length} />,
          tone: "paper" as const,
          screens: 1.75,
        }))
      : []),
    ...(show.guestbook ? [{ id: "guestbook", node: <Guestbook initial={wishes} /> }] : []),
    ...(show.video ? [{ id: "video", node: <VideoWishes />, tone: "paper" as const }] : []),
    ...(show.games ? [{ id: "games", node: <GamesTeaser /> }] : []),
    ...(show.gifts && config.gifts.length > 0 ? [{ id: "gifts", node: <GiftBox />, tone: "paper" as const }] : []),
    { id: "thanks", node: <ThankYou /> },
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
