import type { Exhibitor, ForumNotification, Sponsor, SubEvent } from "./types";

export const sponsors: Sponsor[] = [
  {
    id: "fieldnote",
    name: "Fieldnote Capital",
    tier: "host",
    summary: "A small fund. They host Assembly and keep a partner in the building all three days.",
    deals: [
      {
        id: "fieldnote-hours",
        title: "Thirty minutes with a partner",
        detail: "Office hours on Wednesday. Sign the sheet at the Map Room desk. The code is how the desk finds your line.",
        code: "FIELDNOTE-HALL",
      },
    ],
  },
  {
    id: "keel",
    name: "Keel",
    tier: "patron",
    summary: "Planning software for teams on a quarterly cadence. Mira Chen's company.",
    deals: [
      {
        id: "keel-quarter",
        title: "Ninety days of Keel",
        detail: "A team that attended can pick up ninety days at the Lobby desk. Show the badge on this phone. Nothing is emailed.",
      },
    ],
  },
  {
    id: "brine",
    name: "Brine",
    tier: "patron",
    summary: "Sensors for harsh rooms. Jonah Park's company.",
    deals: [
      {
        id: "brine-visit",
        title: "A drawing for six factory visits",
        detail: "Leave your name at table B4 during the Studio Walk. Six visits in 2027. The drawing happens at the closing.",
      },
    ],
  },
  {
    id: "atelier",
    name: "Atelier North",
    tier: "partner",
    summary: "A design studio for companies past their first identity. Leila Okonkwo is their design director.",
    deals: [
      {
        id: "atelier-critique",
        title: "Three brand critiques",
        detail: "Twenty minutes each. The sheet is in the Reading Room at Wednesday noon. Three names, then it closes.",
      },
    ],
  },
  {
    id: "civic",
    name: "Civic Circuit",
    tier: "partner",
    summary: "A policy shop. Hassan Rahman directs the work, and they print the packet that goes with his talk.",
    deals: [
      {
        id: "civic-packet",
        title: "The printed policy packet",
        detail: "Ask at the host desk after Hassan's talk. The code is on the cover so the desk can match copies to passes.",
        code: "CIVIC-PACKET",
      },
    ],
  },
  {
    id: "harbor-press",
    name: "Harbor Press",
    tier: "partner",
    summary: "A Seattle press. They print the Assembly reader and staff a desk in the Lobby.",
    deals: [
      {
        id: "harbor-reader",
        title: "The Assembly reader",
        detail: "One copy per pass, at the Lobby desk, while they last. Nora Petrov is the editor if you want to talk about a piece.",
      },
    ],
  },
];

export const subEvents: SubEvent[] = [
  {
    id: "studio-walk",
    name: "Studio Walk",
    summary:
      "Eight companies at tables in the Arcade. No booth taller than a person. The point is a conversation you could not have had from a website.",
    whenLabel: "Wednesday, 5:30–8:00 PM",
    where: "Arcade, Floor 2",
    start: "2026-11-11T17:30:00-08:00",
    end: "2026-11-11T20:00:00-08:00",
  },
  {
    id: "talent-market",
    name: "Talent Market",
    summary:
      "Hiring tables in the Cloister. Each company lists the roles that are actually open. Conversations are optional and meant to be short.",
    whenLabel: "Thursday, 1:00–4:30 PM",
    where: "Cloister, Floor 2",
    start: "2026-11-12T13:00:00-08:00",
    end: "2026-11-12T16:30:00-08:00",
  },
];

export const exhibitors: Exhibitor[] = [
  {
    id: "parcel",
    subEventId: "studio-walk",
    name: "Parcel",
    table: "A1",
    category: "Logistics",
    summary: "Routing for deliveries a city can explain to a resident.",
  },
  {
    id: "paperweight",
    subEventId: "studio-walk",
    name: "Paperweight",
    table: "A2",
    category: "Tools",
    summary: "An editor for the memos a company actually sends.",
  },
  {
    id: "lowline",
    subEventId: "studio-walk",
    name: "Lowline",
    table: "A3",
    category: "Manufacturing",
    summary: "A marketplace for short-run work in basements and bays.",
  },
  {
    id: "sable",
    subEventId: "studio-walk",
    name: "Sable Health",
    table: "A4",
    category: "Health",
    summary: "Clinic schedules that keep a lunch hour intact.",
  },
  {
    id: "thread",
    subEventId: "studio-walk",
    name: "Thread & Grain",
    table: "B1",
    category: "Goods",
    summary: "Sourcing notes for makers who still know their mills.",
  },
  {
    id: "municipal",
    subEventId: "studio-walk",
    name: "Municipal Supply",
    table: "B2",
    category: "Civic",
    summary: "Procurement that does not begin with a portal maze.",
  },
  {
    id: "keel-table",
    subEventId: "studio-walk",
    name: "Keel",
    table: "B3",
    category: "Tools",
    summary: "Quarterly planning for teams that ship.",
  },
  {
    id: "brine-table",
    subEventId: "studio-walk",
    name: "Brine",
    table: "B4",
    category: "Climate",
    summary: "A sensor kit for rooms that get wet, hot, or both.",
  },
  {
    id: "keel-hiring",
    subEventId: "talent-market",
    name: "Keel",
    table: "T1",
    category: "Product",
    summary: "The planning team is hiring people who can edit as well as ship.",
    roles: ["Product manager", "Staff editor"],
  },
  {
    id: "brine-hiring",
    subEventId: "talent-market",
    name: "Brine",
    table: "T2",
    category: "Hardware",
    summary: "Factory and field roles. Malik Johnson can talk about the sensor team.",
    roles: ["Mechanical engineer", "Field technician"],
  },
  {
    id: "atelier-hiring",
    subEventId: "talent-market",
    name: "Atelier North",
    table: "T3",
    category: "Design",
    summary: "One brand designer. Chris Pell is at the table and will not follow you into the hall.",
    roles: ["Brand designer"],
  },
  {
    id: "fieldnote-hiring",
    subEventId: "talent-market",
    name: "Fieldnote Capital",
    table: "T4",
    category: "Investing",
    summary: "A research seat for someone who likes primary work more than decks.",
    roles: ["Research analyst"],
  },
  {
    id: "civic-hiring",
    subEventId: "talent-market",
    name: "Civic Circuit",
    table: "T5",
    category: "Policy",
    summary: "A researcher who has worked with a city, not only read about one.",
    roles: ["Policy researcher"],
  },
  {
    id: "sable-hiring",
    subEventId: "talent-market",
    name: "Sable Health",
    table: "T6",
    category: "Health",
    summary: "Someone to sit with clinics while the schedule is installed.",
    roles: ["Implementation lead"],
  },
];

export const notifications: ForumNotification[] = [
  {
    id: "welcome",
    title: "Your pass is at the desk",
    body: "Badges are in the Lobby from 8:30 AM Tuesday. The sample on your Badge screen is the pass this demo uses.",
    sentAt: "2026-10-20T09:00:00-07:00",
    kind: "desk",
  },
  {
    id: "maintenance-room",
    title: "Maintenance as a product stays put",
    body: "Elliot March is confirmed in the Reading Room on Wednesday at 11:30 AM. There is no room change.",
    sentAt: "2026-10-21T13:05:00-07:00",
    kind: "schedule",
  },
  {
    id: "keynote-filling",
    title: "The opening keynote is nearly full",
    body: "“A longer attention” has few seats left in the Main Hall. Save one if you want to be in the room.",
    sentAt: "2026-10-22T16:40:00-07:00",
    kind: "schedule",
  },
  {
    id: "fieldnote-deal",
    title: "Fieldnote posted office hours",
    body: "A partner is taking thirty-minute meetings on Wednesday. The code is on the Fieldnote card, under Sponsors.",
    sentAt: "2026-10-23T11:15:00-07:00",
    kind: "deal",
  },
  {
    id: "studio-tables",
    title: "Studio Walk tables are up",
    body: "Eight companies in the Arcade on Wednesday at 5:30 PM. Parcel is A1. Brine is B4.",
    sentAt: "2026-10-23T18:20:00-07:00",
    kind: "gathering",
  },
  {
    id: "talent-reminder",
    title: "Talent Market opens Thursday at 1:00 PM",
    body: "Hiring tables are in the Cloister. Roles are listed on each company. Conversations are short on purpose.",
    sentAt: "2026-10-24T08:00:00-07:00",
    kind: "reminder",
  },
];
