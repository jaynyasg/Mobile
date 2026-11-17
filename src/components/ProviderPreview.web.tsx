import { createElement, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { providerPreview } from "@/logic/providerPreview";
import { openExternal } from "@/navigation/pwaNav";
import { useOverlayHistory } from "./useOverlayHistory";
import type { ProviderPreviewProps } from "./ProviderPreview";
export function ProviderPreview({ href, name, detail, onClose, onConfirmed }: ProviderPreviewProps) {
  const provider = providerPreview(href);
  const [overview, setOverview] = useState(!provider?.embedded);
  const dialog = useRef<HTMLDialogElement>(null);
  useOverlayHistory(true, onClose);
  function close() {
    if (window.history.state?.tatelOverlay) window.history.back();
    else onClose();
  }
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const element = dialog.current;
    element?.showModal();
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { element?.close(); document.body.style.overflow = oldOverflow; previous?.focus(); };
  }, []);
  return createPortal(createElement("dialog", { ref: dialog, "aria-label": `Book with ${name}`, className: "provider-window", onCancel: (event: Event) => { event.preventDefault(); close(); } },
    createElement("div", { className: "provider-toolbar" },
      createElement("button", { onClick: close }, "Back to TATEL"), createElement("strong", null, name), createElement("span", null, provider?.host ?? "Provider unavailable"),
      createElement("p", null, provider?.embedded ? "Browse and book with the provider here. If any part cannot open, use their website. Your TATEL plan stays saved." : "This provider requires its own website. Review your stay here, then open the provider to book. Return to TATEL when you are ready."),
      createElement("div", { className: "provider-actions" },
        provider?.embedded ? createElement("button", { onClick: () => setOverview(!overview) }, overview ? "Show provider website" : "Show overview") : null,
        provider ? createElement("button", { onClick: () => openExternal(provider.href) }, "Open provider in new tab") : null,
        onConfirmed ? createElement("button", { onClick: () => { onConfirmed(); close(); } }, "I have a confirmed reservation") : null)),
    overview ? createElement("div", { className: "provider-overview" }, createElement("h2", null, "Make yourself at home"), createElement("p", null, detail ?? "Check dates, availability, inclusions, and cancellation terms directly with the provider."), createElement("p", null, "Opening this window does not reserve a room or activity. Only save a reservation after the provider confirms it.")) : provider ? createElement("iframe", { title: `${name} booking website`, src: provider.href, sandbox: "allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox", referrerPolicy: "strict-origin-when-cross-origin", allow: "payment", className: "provider-frame" }) : null), document.body);
}
