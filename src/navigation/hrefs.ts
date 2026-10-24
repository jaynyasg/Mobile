import type { Href } from "expo-router";
import type { Citation } from "@/logic/assistant";

export function citationHref(citation: Citation): Href {
  switch (citation.kind) {
    case "session":
      return { pathname: "/session/[id]", params: { id: citation.id } };
    case "speaker":
      return { pathname: "/speaker/[id]", params: { id: citation.id } };
    case "sponsor":
      return { pathname: "/sponsor/[id]", params: { id: citation.id } };
    case "screen":
      switch (citation.id) {
        case "venue":
          return "/venue";
        case "studio-walk":
          return "/studio-walk";
        case "talent-market":
          return "/talent-market";
        case "settings":
          return "/settings";
        case "ticket":
          return "/ticket";
        case "agenda":
          return "/agenda";
        case "sponsors":
          return "/sponsors";
        default:
          return "/";
      }
  }
}
