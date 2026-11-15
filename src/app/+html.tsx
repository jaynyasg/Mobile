import { ScrollViewStyleReset } from "expo-router/html";
import type { PropsWithChildren } from "react";

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover" />
        <title>TATEL · Sessions</title>
        <meta name="description" content="TATEL · Sessions. January 26–29, 2027, across the Virgin Islands." />
        <meta name="theme-color" content="#071B2A" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="TATEL" />
        <link rel="manifest" href="/manifest.webmanifest" />
        <script
          data-tatel-install
          dangerouslySetInnerHTML={{
            __html: `window.__tatelInstall=window.__tatelInstall||{prompt:null,installed:false};window.addEventListener("beforeinstallprompt",function(event){event.preventDefault();window.__tatelInstall.prompt=event;window.__tatelInstall.installed=false;try{localStorage.removeItem("tatel.install.installed");}catch(e){}});window.addEventListener("appinstalled",function(){window.__tatelInstall.prompt=null;window.__tatelInstall.installed=true;try{localStorage.setItem("tatel.install.installed","1");}catch(e){}});if("serviceWorker"in navigator&&location.hostname!=="localhost"&&location.hostname!=="127.0.0.1"){window.addEventListener("load",function(){navigator.serviceWorker.register("/sw.js",{scope:"/"}).catch(function(){});});}`,
          }}
        />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
