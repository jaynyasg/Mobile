import { describe, expect, it } from "vitest";
import { patchPwaHtml } from "./pwa-html.mjs";

const live = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
    <title>TATEL · Sessions</title>
  <meta name="theme-color" content="#071B2A">
<link rel="manifest" href="/manifest.webmanifest" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="mobile-web-app-capable" content="yes" />
  <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
</head>
  <body></body>
</html>`;

describe("PWA html patch", () => {
  it("adds the iOS title, translucent status bar, and cover viewport that the export drops", () => {
    const html = patchPwaHtml(live);
    expect(html).toContain('<meta name="apple-mobile-web-app-title" content="TATEL" />');
    expect(html).toContain('<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />');
    expect(html).toContain('content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover"');
    expect(html.match(/name="apple-mobile-web-app-capable"/g)).toHaveLength(1);
    expect(html).toContain('<meta name="mobile-web-app-capable" content="yes" />');
    expect(html.match(/name="viewport"/g)).toHaveLength(1);
    expect(html).toContain('<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />');
    expect(html.match(/rel="apple-touch-icon"/g)).toHaveLength(1);
  });

  it("still adds the plain mobile-web-app-capable tag when only the apple tag is present", () => {
    const appleOnly = live.replace('  <meta name="mobile-web-app-capable" content="yes" />\n', "");
    expect(patchPwaHtml(appleOnly)).toContain('<meta name="mobile-web-app-capable" content="yes" />');
  });

  it("leaves a document that already has the tags alone", () => {
    const ready = patchPwaHtml(live);
    expect(patchPwaHtml(ready)).toBe(ready);
  });
});
