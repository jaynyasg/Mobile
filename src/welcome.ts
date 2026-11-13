export const WELCOME_KEY = "tatel.welcomeSeen";

interface WelcomeStorage {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
}

export function hasSeenWelcome(storage: WelcomeStorage | null): boolean {
  if (!storage) return false;
  return storage.getItem(WELCOME_KEY) === "1";
}

export function markWelcomeSeen(storage: WelcomeStorage | null): void {
  storage?.setItem(WELCOME_KEY, "1");
}

export function webStorage(): WelcomeStorage | null {
  if (typeof localStorage === "undefined") return null;
  return localStorage;
}

export interface WelcomePage {
  id: string;
  kicker?: string;
  title: string;
  body: string;
  install?: boolean;
}

export function welcomePages(input: {
  name: string;
  edition: string;
  kicker: string;
  dateLabel: string;
  placeLabel: string;
  pillars: { name: string; island: string }[];
  days: { phase: string }[];
  staysIntro: string;
  passNote: string;
}): WelcomePage[] {
  const islands = input.pillars.map((pillar) => `${pillar.name} on ${pillar.island}`).join(". ");
  const aboard = input.staysIntro.split(".").find((sentence) => sentence.toLowerCase().includes("aboard"))?.trim();
  return [
    {
      id: "what",
      kicker: input.edition,
      title: input.kicker,
      body: `${input.name}. ${input.dateLabel}. ${input.placeLabel}.`,
    },
    {
      id: "islands",
      title: "The islands",
      body: `${islands}.`,
    },
    {
      id: "sessions",
      title: "Your schedule",
      body: `Sessions move through ${input.days.map((day) => day.phase).join(", ")}. Save the ones you want.`,
    },
    {
      id: "around",
      title: "Getting around",
      body: `Proposed sessions and transport arrangements are unconfirmed. ${aboard ?? "Stay aboard the fleet, beside the beach, or ashore"}.`,
    },
    {
      id: "together",
      title: "Community and your pass",
      body: `Community is the live chat. ${input.passNote}`,
      install: true,
    },
  ];
}
