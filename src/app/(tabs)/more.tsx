import { Href } from "expo-router";
import { useContent } from "@/content/provider";
import { Screen } from "@/components/Screen";
import { LinkRow, PageHeader, SectionLabel } from "@/components/ui";
import { useApp } from "@/store";

export default function MoreScreen() {
  const { program } = useContent();
  const { notifications } = program;
  const { state } = useApp();
  const unread = notifications.filter((note) => !state.readNotificationIds.includes(note.id)).length;
  const groups: { title: string; items: { href: Href; label: string; detail?: string; badge?: number }[] }[] = [
    {
      title: "Your copy of the draft",
      items: [
        { href: "/schedule", label: "My schedule", detail: "Favorites saved on this device" },
        { href: "/ticket", label: "Pass preview", detail: "Prices shown as a demo. No payment." },
        { href: "/notifications", label: "Notifications", detail: "Notices taken from the source", badge: unread || undefined },
        { href: "/assistant", label: "Guide", detail: "Answers from the program, on this device" },
        { href: "/speakers", label: "Panelists", detail: "Roster from the website" },
        { href: "/network", label: "Network", detail: "Opt-in introductions" },
      ],
    },
    {
      title: "The islands",
      items: [
        { href: "/transport", label: "Sample transport", detail: "Powerboat, ferries, and yacht. Unconfirmed." },
        { href: "/stays", label: "Accommodations", detail: "Brochure pages 21–22" },
      ],
    },
    {
      title: "This device",
      items: [{ href: "/settings", label: "Settings", detail: "Profile, opt-in, and delete my data" }],
    },
  ];

  return (
    <Screen docked photo="/venues/emerald-beach-resort/img_1438-1280.webp">
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
  items: { href: Href; label: string; detail?: string; badge?: number }[];
}) {
  return (
    <>
      <SectionLabel>{title}</SectionLabel>
      {items.map((item) => (
        <LinkRow key={item.label} href={item.href} label={item.label} detail={item.detail} badge={item.badge} />
      ))}
    </>
  );
}
