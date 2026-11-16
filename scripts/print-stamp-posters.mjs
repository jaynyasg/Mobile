/**
 * Print one QR poster per island.
 *   STAMP_SIGNING_SECRET=... node scripts/print-stamp-posters.mjs [outfile.html]
 * Do not commit the secret or the HTML it writes. The HTML contains live codes.
 */
import { createHmac } from "node:crypto";
import { writeFileSync } from "node:fs";
import QRCode from "qrcode";

const secret = process.env.STAMP_SIGNING_SECRET ?? "";
if (!secret) {
  console.error("Set STAMP_SIGNING_SECRET in the environment. Do not commit the value.");
  process.exit(1);
}

const islands = [
  ["tech", "Tech", "St. Thomas"],
  ["ai", "AI", "St. John"],
  ["travel", "Travel", "Scrub Island"],
  ["entertainment", "Entertainment", "Jost Van Dyke"],
  ["law", "Law", "Lovango"],
];

const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function mac(islandId) {
  return createHmac("sha256", secret).update(`tatel-stamp-v1:${islandId}`).digest("hex");
}

function shortCode(islandId, hex) {
  let body = "";
  for (let i = 0; i < 8; i += 1) body += alphabet[Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16) % alphabet.length];
  return `${islandId.slice(0, 4).toUpperCase()}-${body}`;
}

const pages = [];
for (const [id, name, island] of islands) {
  const hex = mac(id);
  const token = `${id}.${hex}`;
  const short = shortCode(id, hex);
  const svg = await QRCode.toString(token, { type: "svg", margin: 1, color: { dark: "#10283A", light: "#F4E2A4" } });
  pages.push(`<section>
    <p class="kicker">TATEL · Island stamp</p>
    <h1>${name}</h1>
    <p>${island}</p>
    <div class="qr">${svg}</div>
    <p class="code">${short}</p>
    <p>Scan the code, or type it in the app. This stamp only counts on ${island}.</p>
  </section>`);
}

const html = `<!doctype html>
<html lang="en">
<meta charset="utf-8" />
<title>TATEL stamp posters</title>
<style>
  body { margin: 0; background: #071421; color: #f5f1e8; font-family: Georgia, serif; }
  section { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; page-break-after: always; padding: 32px; }
  .kicker { letter-spacing: 0.18em; text-transform: uppercase; color: #ffe08a; font-size: 14px; }
  h1 { font-size: 64px; margin: 0; color: #ffe08a; }
  .qr { width: 280px; background: #f4e2a4; padding: 12px; border-radius: 24px; }
  .qr svg { width: 100%; height: auto; display: block; }
  .code { font-size: 28px; letter-spacing: 0.14em; }
</style>
<body>
${pages.join("\n")}
</body>
</html>`;

const out = process.argv[2] || "stamp-posters.html";
writeFileSync(out, html);
console.log(`Wrote ${out}. Do not commit it.`);
