import { Href } from "expo-router";
import { notifications } from "@/content";
import { Screen } from "@/components/Screen";
import { LinkRow, PageHeader, SectionLabel } from "@/components/ui";
import { useApp } from "@/store";

export default function MoreScreen() {
  const { state } = useApp();
  const unread = notifications.filter((note) => !state.readNotificationIds.includes(note.id)).length;
  const groups: { title: string; items: { href: Href; label: string; detail?: string; badge?: number }[] }[] = [
    {
      title: "Your forum",
      items: [
        { href: "/schedule", label: "My schedule", detail: "Favorites and saved seats" },
        { href: "/ticket", label: "Badge", detail: "Sample pass and QR code" },
        { href: "/notifications", label: "Notifications", detail: "Notes from the desk", badge: unread || undefined },
        { href: "/assistant", label: "Guide", detail: "Answers from the program, on this device" },
      ],
    },
    {
      title: "The hall",
      items: [
        { href: "/sponsors", label: "Sponsors and deals" },
        { href: "/studio-walk", label: "Studio Walk", detail: "Wednesday evening" },
        { href: "/talent-market", label: "Talent Market", detail: "Thursday afternoon" },
        { href: "/venue", label: "Harbor Hall", detail: "Rooms and a sample map pin" },
        { href: "/questions", label: "Questions and polls", detail: "Saved on this device" },
      ],
    },
    {
      title: "Account",
      items: [{ href: "/settings", label: "Settings", detail: "Profile, opt-in, and delete my data" }],
    },
  ];

  return (
    <Screen>
      <PageHeader kicker="Portico" title="More" />
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
