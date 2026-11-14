import type { Href } from "expo-router";
import type { Citation } from "@/logic/assistant";

export function citationHref(citation: Citation): Href {
  switch (citation.kind) {
    case "session":
      return { pathname: "/session/[id]", params: { id: citation.id } };
    case "panelist":
      return { pathname: "/speaker/[id]", params: { id: citation.id } };
    case "screen":
      if (citation.id.startsWith("pillar:")) {
        return { pathname: "/pillar/[id]", params: { id: citation.id.slice("pillar:".length) } };
      }
      if (citation.id.startsWith("stay:")) {
        return { pathname: "/stays/[id]", params: { id: citation.id.slice("stay:".length) } };
      }
      switch (citation.id) {
        case "settings":
          return "/settings";
        case "ticket":
          return "/tickets";
        case "agenda":
          return "/agenda";
        case "transport":
          return "/transport";
        default:
          return "/";
      }
  }
}
