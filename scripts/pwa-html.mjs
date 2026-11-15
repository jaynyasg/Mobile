const APPLE_TOUCH_ICON = '<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />';

function ensureAppleTouchIcon(html) {
  const pattern = /<link\s+[^>]*rel=["']apple-touch-icon["'][^>]*>/i;
  const match = html.match(pattern);
  if (!match) return insertBeforeHeadEnd(html, APPLE_TOUCH_ICON);
  if (/sizes=["']180x180["']/.test(match[0]) && match[0].includes("/apple-touch-icon.png")) return html;
  return html.replace(match[0], APPLE_TOUCH_ICON);
}

function insertBeforeHeadEnd(html, tag) {
  if (!html.includes("</head>")) return `${html}\n${tag}\n`;
  return html.replace("</head>", `  ${tag}\n</head>`);
}

function ensureViewportFit(html) {
  const pattern = /<meta\s+[^>]*name=["']viewport["'][^>]*>/i;
  const match = html.match(pattern);
  if (!match) {
    return insertBeforeHeadEnd(html, '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />');
  }
  const tag = match[0];
  if (/viewport-fit\s*=\s*cover/i.test(tag)) return html;
  const content = tag.match(/content=(["'])([\s\S]*?)\1/i);
  if (!content) return html;
  const value = content[2].trim().replace(/,\s*$/, "");
  const updated = tag.replace(content[0], `content=${content[1]}${value}, viewport-fit=cover${content[1]}`);
  return html.replace(tag, updated);
}

const INSTALL_CAPTURE = `<script data-tatel-install>
window.__tatelInstall=window.__tatelInstall||{prompt:null,installed:false};
window.addEventListener("beforeinstallprompt",function(event){
  event.preventDefault();
  window.__tatelInstall.prompt=event;
  window.__tatelInstall.installed=false;
  try{localStorage.removeItem("tatel.install.installed");}catch(e){}
});
window.addEventListener("appinstalled",function(){
  window.__tatelInstall.prompt=null;
  window.__tatelInstall.installed=true;
  try{localStorage.setItem("tatel.install.installed","1");}catch(e){}
});
if("serviceWorker"in navigator&&location.hostname!=="localhost"&&location.hostname!=="127.0.0.1"){
  window.addEventListener("load",function(){navigator.serviceWorker.register("/sw.js",{scope:"/"}).catch(function(){});});
}
</script>`;

export function patchPwaHtml(html) {
  let next = html;
  if (!next.includes('rel="manifest"') && !next.includes("rel='manifest'")) {
    next = insertBeforeHeadEnd(next, '<link rel="manifest" href="/manifest.webmanifest" />');
  }
  if (!next.includes("apple-mobile-web-app-capable")) {
    next = insertBeforeHeadEnd(next, '<meta name="apple-mobile-web-app-capable" content="yes" />');
  }
  if (!/name=["']mobile-web-app-capable["']/.test(next)) {
    next = insertBeforeHeadEnd(next, '<meta name="mobile-web-app-capable" content="yes" />');
  }
  next = ensureAppleTouchIcon(next);
  if (!next.includes("apple-mobile-web-app-title")) {
    next = insertBeforeHeadEnd(next, '<meta name="apple-mobile-web-app-title" content="TATEL" />');
  }
  if (!next.includes("apple-mobile-web-app-status-bar-style")) {
    next = insertBeforeHeadEnd(next, '<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />');
  }
  if (!/name=["']theme-color["']/.test(next)) {
    next = insertBeforeHeadEnd(next, '<meta name="theme-color" content="#071B2A" />');
  }
  if (!next.includes("data-tatel-install")) next = insertBeforeHeadEnd(next, INSTALL_CAPTURE);
  return ensureViewportFit(next);
}
