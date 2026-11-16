export const TECH_INTERESTS = [
  "EdTech",
  "AgriTech",
  "MedTech",
  "SportsTech",
  "LegalTech",
  "MediaTech",
  "XR",
  "FilmTech",
  "NewsTech",
  "MarketingTech",
  "FinTech",
  "TravelTech",
  "HospitalityTech",
  "EventTech",
  "AdminTech",
] as const;

export type TechInterest = (typeof TECH_INTERESTS)[number];

const RULES: { id: TechInterest; re: RegExp; pillars?: string[] }[] = [
  { id: "XR", re: /\bxr\b|\bvr\b|virtual|spatial|immersion|\bdojo\b|digital map/i },
  { id: "FilmTech", re: /\bfilm\b|screening|on screen|\bstudio\b/i },
  { id: "HospitalityTech", re: /\bhotel\b|hospitality|guest's table|guest spend/i },
  { id: "AgriTech", re: /harvest|\bfarm\b|food supply|local food/i },
  { id: "MedTech", re: /the care exists|diagnosis|clinical|\bhealth\b/i },
  { id: "EdTech", re: /classroom|\blearner\b|\blearning\b|student|training|mentorship|\bschool\b/i },
  { id: "SportsTech", re: /\bsport\b|athlete|\bfifa\b|poker-run|poker run/i },
  { id: "NewsTech", re: /\bnewsroom\b|\bjournalist\b/i },
  { id: "MarketingTech", re: /\bmarketing\b|\bbrand\b/i },
  { id: "EventTech", re: /\bevent\b|red-carpet|festival/i },
  { id: "FinTech", re: /\binvest\b|funding|refund|settlement|\bfees?\b|who pays|purchase order/i },
  { id: "AdminTech", re: /workflow|administrative|public-service|public service|\brecords\b|inspector|\bregulation\b/i },
  { id: "LegalTech", re: /\blaw\b|\blegal\b|licen[sc]e|\bpermission\b|\brights\b|jurisdiction/i, pillars: ["law"] },
  { id: "TravelTech", re: /\bjourney\b|\bferry\b|\barrival\b|\bvisitor\b|\bcharter\b|\bboat\b|\bbooking\b/i, pillars: ["travel"] },
  { id: "MediaTech", re: /\bstory\b|\bcreator\b|\bcontent\b|\bscreen\b/i, pillars: ["entertainment"] },
];

export function sessionInterest(session: { title: string; description: string; pillarId: string }): TechInterest | null {
  const blob = `${session.title} ${session.description}`;
  let best: { id: TechInterest; score: number } | null = null;
  for (const rule of RULES) {
    let score = rule.re.test(blob) ? 5 : 0;
    if (rule.pillars?.includes(session.pillarId)) score += 2;
    if (score > (best?.score ?? 0)) best = { id: rule.id, score };
  }
  if (best && best.score >= 2) return best.id;
  if (session.pillarId === "law") return "LegalTech";
  if (session.pillarId === "travel") return "TravelTech";
  if (session.pillarId === "entertainment") return "MediaTech";
  return null;
}

export function phaseTag(phase: string): string {
  if (phase === "The Problem") return "Problem";
  if (phase === "The Plan / Solution") return "Plan";
  if (phase === "Build") return "Build";
  if (phase === "Showcase") return "Showcase";
  return phase;
}

export function suggestSessions<T extends { id: string; title: string; description: string; pillarId: string; featured?: boolean }>(
  sessions: readonly T[],
  interests: readonly string[],
  areas: readonly string[],
  limit = 4,
): T[] {
  const wanted = new Set(interests);
  const areaSet = new Set(areas);
  if (!wanted.size && !areaSet.size) {
    return [...sessions].filter((session) => session.featured).slice(0, limit);
  }
  return [...sessions]
    .map((session) => {
      const interest = sessionInterest(session);
      let score = 0;
      if (interest && wanted.has(interest)) score += 8;
      if (areaSet.has(session.pillarId)) score += 3;
      if (session.featured) score += 1;
      return { session, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.session.title.localeCompare(b.session.title))
    .slice(0, limit)
    .map((item) => item.session);
}
