import { forum, formatLabel, roomById, sessions, speakerNames } from "../src/content";
import { formatRange } from "../src/logic/time";

console.log(`${forum.name} ${forum.edition}`);
console.log(forum.dateLabel);
console.log(`${forum.venue.name}, ${forum.venue.addressLine}, ${forum.venue.locality}`);

for (const day of forum.days) {
  console.log(`\n${day.weekday}, ${day.month} ${day.dayNumber}`);
  for (const session of sessions.filter((item) => item.dayId === day.id)) {
    const room = roomById(session.roomId)?.name ?? "";
    const people = speakerNames(session);
    console.log(`${formatRange(session.start, session.end, forum.timezone)}  ${session.title}`);
    console.log(`  ${formatLabel[session.format]} · ${room}${people ? ` · ${people}` : ""}`);
  }
}
