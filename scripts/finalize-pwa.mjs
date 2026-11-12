import { readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../dist");
const htmlPath = path.join(dist, "index.html");
if (!existsSync(htmlPath)) throw new Error("dist/index.html is missing. Run expo export -p web first.");

const manifest = {
  name: "TATEL · Conversations",
  short_name: "TATEL",
  description: "TATEL · Conversations. January 26–29, 2027, across the Virgin Islands.",
  id: "https://tatel.app/",
  start_url: "https://tatel.app/",
  scope: "https://tatel.app/",
  display: "standalone",
  background_color: "#071B2A",
  theme_color: "#071B2A",
  lang: "en",
  icons: [
    { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
    { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
  ],
};
writeFileSync(path.join(dist, "manifest.webmanifest"), `${JSON.stringify(manifest, null, 2)}\n`);

let html = readFileSync(htmlPath, "utf8");
if (!html.includes('rel="manifest"')) {
  html = html.replace("</head>", '  <link rel="manifest" href="/manifest.webmanifest" />\n</head>');
}
if (!html.includes("apple-mobile-web-app-capable")) {
  html = html.replace(
    "</head>",
    '  <meta name="apple-mobile-web-app-capable" content="yes" />\n  <meta name="mobile-web-app-capable" content="yes" />\n  <link rel="apple-touch-icon" href="/apple-touch-icon.png" />\n</head>',
  );
}
if (!html.includes('name="theme-color"')) {
  html = html.replace("</head>", '  <meta name="theme-color" content="#071B2A" />\n</head>');
}
writeFileSync(htmlPath, html);
console.log("PWA manifest and iOS tags are in dist/");
