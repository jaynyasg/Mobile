import { readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { patchPwaHtml } from "./pwa-html.mjs";

const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../dist");
const htmlPath = path.join(dist, "index.html");
if (!existsSync(htmlPath)) throw new Error("dist/index.html is missing. Run expo export -p web first.");

const manifest = {
  name: "TATEL · Sessions",
  short_name: "TATEL",
  description: "TATEL · Sessions. January 26–29, 2027, across the Virgin Islands.",
  id: "https://tatel.app/",
  start_url: "https://tatel.app/",
  scope: "https://tatel.app/",
  display: "standalone",
  background_color: "#071B2A",
  theme_color: "#071B2A",
  lang: "en",
  icons: [
    { src: "/apple-touch-icon.png", sizes: "180x180", type: "image/png", purpose: "any" },
    { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
    { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
  ],
};
writeFileSync(path.join(dist, "manifest.webmanifest"), `${JSON.stringify(manifest, null, 2)}\n`);

const html = patchPwaHtml(readFileSync(htmlPath, "utf8"));
writeFileSync(htmlPath, html);
console.log("PWA manifest and iOS tags are in dist/");
