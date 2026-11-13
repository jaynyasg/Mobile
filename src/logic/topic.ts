export const TOPIC_COLOR: Record<string, string> = {
  tech: "#BAE6FF",
  ai: "#C6FFDC",
  travel: "#FFE6AA",
  entertainment: "#FFD6BE",
  law: "#E6DCFF",
};

export function sessionTopic(
  session: { pillarId: string },
  pillars: { id: string; name: string }[],
): { id: string; name: string; color: string } | null {
  const pillar = pillars.find((item) => item.id === session.pillarId || item.name === session.pillarId);
  if (!pillar) return null;
  return { id: pillar.id, name: pillar.name, color: TOPIC_COLOR[pillar.id] ?? "#FFE08A" };
}
