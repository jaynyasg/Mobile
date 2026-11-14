/**
 * First-timer facts for the Virgin Islands. Each line is short on purpose.
 * Longer detail and the source sit behind More. Check-before-travel marks
 * rules that offices can change.
 */
export interface EssentialSource {
  title: string;
  url: string;
}

export interface Essential {
  id: string;
  title: string;
  line: string;
  more: string;
  check: boolean;
  sources: EssentialSource[];
}

export const essentials: Essential[] = [
  {
    id: "usvi-entry",
    title: "The USVI is the United States",
    line: "U.S. citizens do not need a passport from the mainland.",
    more: "U.S. citizens can travel between the mainland, Puerto Rico, and the U.S. Virgin Islands without a passport. Flights still need a REAL ID or another TSA-accepted ID, such as a passport. Check the ID rule before you fly.",
    check: true,
    sources: [
      { title: "USAGov, U.S. territories", url: "https://www.usa.gov/visit-territories" },
      { title: "Visit USVI, no passport for U.S. visitors", url: "https://www.visitusvi.com/travel-information/no-passport/" },
    ],
  },
  {
    id: "bvi-entry",
    title: "The BVI asks for a passport",
    line: "A valid passport, and the online entry card.",
    more: "The British Virgin Islands require a passport to enter and leave, including by sea. U.S. citizens need a valid passport. Complete the online entry and departure card at bviedcard.gov.vg, within 72 hours of travel. Check the form and any visa rule before you go.",
    check: true,
    sources: [
      { title: "BVI Tourism, customs and immigration", url: "https://www.bvitourism.com/travel/entry-requirements" },
      { title: "travel.state.gov, British Virgin Islands", url: "https://travel.state.gov/content/travel/en/international-travel/International-Travel-Country-Information-Pages/BritishVirginIslands.html" },
      { title: "Government of the Virgin Islands, ED card", url: "https://gov.vg/service-details/complete-your-bvi-entry-and-departure-card" },
    ],
  },
  {
    id: "money",
    title: "Dollars on both sides",
    line: "The currency is the U.S. dollar.",
    more: "The U.S. Virgin Islands use the U.S. dollar. The British Virgin Islands also use the U.S. dollar. Cards are widely accepted; carry some cash for smaller stops.",
    check: false,
    sources: [
      { title: "Visit USVI, travel tips", url: "https://www.visitusvi.com/travel-information/travel-tips-frequently-asked-questions/" },
      { title: "Government of Canada, BVI travel advice", url: "https://travel.gc.ca/destinations/british-virgin-islands" },
    ],
  },
  {
    id: "driving",
    title: "Keep left",
    line: "Both the USVI and the BVI drive on the left.",
    more: "Seat belts are required. In the USVI it is illegal to drive while on a phone call. In the BVI, driving is on the left and phone use while driving is prohibited. Check the rental rules before you take a car.",
    check: true,
    sources: [
      { title: "Visit USVI, travel tips", url: "https://www.visitusvi.com/travel-information/travel-tips-frequently-asked-questions/" },
      { title: "travel.state.gov, British Virgin Islands", url: "https://travel.state.gov/content/travel/en/international-travel/International-Travel-Country-Information-Pages/BritishVirginIslands.html" },
    ],
  },
  {
    id: "ferries",
    title: "A ferry crosses a border",
    line: "USVI to BVI means a passport and clearance.",
    more: "Jost Van Dyke and Scrub Island are in the British Virgin Islands. A boat from St. Thomas or St. John is an international arrival. Have your passport, and complete the BVI entry card before you travel. Office hours and the boat itself can change.",
    check: true,
    sources: [
      { title: "BVI Tourism, customs and immigration", url: "https://www.bvitourism.com/travel/entry-requirements" },
      { title: "travel.state.gov, passport for sea arrival", url: "https://travel.state.gov/content/travel/en/international-travel/International-Travel-Country-Information-Pages/BritishVirginIslands.html" },
    ],
  },
  {
    id: "weather",
    title: "January is the mild season",
    line: "Warm days, lighter rain. Hurricane season is later.",
    more: "In Road Town, winter days are about 84°F (29°C) and nights about 70°F (21°C). Hurricane season runs from June through November. Pack a light layer and a rain shell, and check the forecast before you fly.",
    check: true,
    sources: [
      { title: "Government of the Virgin Islands, geography and climate", url: "https://bvi.gov.vg/content/geography" },
      { title: "travel.state.gov, hurricanes", url: "https://travel.state.gov/content/travel/en/international-travel/International-Travel-Country-Information-Pages/BritishVirginIslands.html" },
    ],
  },
  {
    id: "clock",
    title: "Atlantic time",
    line: "AST, four hours behind UTC. No seasonal shift in the program clock.",
    more: "Session times in this app use America/Virgin, Atlantic Standard Time (UTC−4). Confirm the local clock on your phone before a boat.",
    check: true,
    sources: [
      { title: "Program clock, America/Virgin", url: "https://www.visitusvi.com/travel-information/travel-tips-frequently-asked-questions/" },
    ],
  },
  {
    id: "safety",
    title: "If you need help",
    line: "USVI: 911. BVI: 999.",
    more: "In the U.S. Virgin Islands, dial 911. From a cell phone in Virgin Islands National Park, the park also lists (340) 776-9110. In the British Virgin Islands, dial 999 for police. Check the number posted where you are staying.",
    check: true,
    sources: [
      { title: "National Park Service, Virgin Islands safety", url: "https://www.nps.gov/viis/planyourvisit/safety.htm" },
      { title: "travel.state.gov, report crime at 999", url: "https://travel.state.gov/content/travel/en/international-travel/International-Travel-Country-Information-Pages/BritishVirginIslands.html" },
    ],
  },
  {
    id: "sun",
    title: "Mineral sunscreen in the USVI",
    line: "Oxybenzone, octinoxate, and octocrylene are prohibited.",
    more: "U.S. Virgin Islands law restricts sunscreens that contain oxybenzone, octinoxate, or octocrylene. The tourism board asks for a non-nano mineral sunscreen with zinc oxide or titanium dioxide. Read the bottle. This rule is the USVI’s; check the label before a BVI beach too.",
    check: true,
    sources: [
      { title: "Visit USVI, mineral sunscreen", url: "https://www.visitusvi.com/travel-information/travel-tips-frequently-asked-questions/" },
      { title: "Legislature of the Virgin Islands, Act 8185", url: "https://billtracking.legvi.org/bill_detail/27051/" },
    ],
  },
];
