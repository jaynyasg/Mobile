import { Href } from "expo-router";
import { type ReelId } from "@/content/reels";
import { useContent } from "@/content/provider";
import { Screen } from "@/components/Screen";
import { LinkRow, PageHeader, SectionLabel } from "@/components/ui";
import { backgrounds } from "@/components/backgrounds";
import { useApp } from "@/store";

export default function MoreScreen() {
  const { program } = useContent();
  const { notifications } = program;
  const { state } = useApp();
  const unread = notifications.filter((note) => !state.readNotificationIds.includes(note.id)).length;
  const groups: { title: string; items: { href: Href; label: string; detail?: string; badge?: number; reelId?: ReelId }[] }[] = [
    {
      title: "Your copy of the draft",
      items: [
        { href: "/schedule", label: "My schedule", detail: "Favorites saved on this device" },
        { href: "/ticket", label: "Pass preview", detail: "Prices shown as a demo. No payment.", reelId: "pass" },
        { href: "/notifications", label: "Notifications", detail: "Notices taken from the source", badge: unread || undefined },
        { href: "/assistant", label: "Guide", detail: "Answers from the program, on this device" },
        { href: "/speakers", label: "Panelists", detail: "Roster from the website" },
        { href: "/network", label: "Network", detail: "Opt-in introductions" },
      ],
    },
    {
      title: "The islands",
      items: [
        { href: "/transport", label: "Sample transport", detail: "Powerboat, ferries, and yacht. Unconfirmed.", reelId: "transport" },
        { href: "/stays", label: "Accommodations", detail: "Brochure pages 21–22", reelId: "stays" },
      ],
    },
    {
      title: "This device",
      items: [{ href: "/settings", label: "Settings", detail: "Profile, opt-in, and delete my data" }],
    },
  ];

  return (
    <Screen docked photo={backgrounds.more.day} night={backgrounds.more.night} phase={backgrounds.more.phase}>
      <PageHeader kicker="TATEL" title="More" />
      {groups.map((group) => (
        <ViewSection key={group.title} title={group.title} items={group.items} />
      ))}
    </Screen>
  );
}

function ViewSection({
  title,
  items,
}: {
  title: string;
  items: { href: Href; label: string; detail?: string; badge?: number; reelId?: ReelId }[];
}) {
  return (
    <>
      <SectionLabel>{title}</SectionLabel>
      {items.map((item) => (
        <LinkRow key={item.label} href={item.href} label={item.label} detail={item.detail} badge={item.badge} reelId={item.reelId} />
      ))}
    </>
  );
}
