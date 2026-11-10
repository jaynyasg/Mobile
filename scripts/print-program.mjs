import { readFileSync } from "node:fs";

const data = JSON.parse(readFileSync(new URL("../src/content/tatel.json", import.meta.url), "utf8"));
console.log(`${data.forum.name} · ${data.forum.edition}`);
console.log(data.forum.dateLabel);
console.log(data.forum.draftNotice);
console.log(`${data.sessions.length} proposed sessions · ${data.panelists.length} panelists`);
for (const day of data.forum.days) {
  const count = data.sessions.filter((session) => session.dayId === day.id).length;
  console.log(`${day.label}: ${count}`);
}
