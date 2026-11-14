import { Redirect, useLocalSearchParams } from "expo-router";
import { ticketsLocation } from "@/logic/ticketsRoute";

function text(value: string | string[] | undefined): string | null {
  return typeof value === "string" ? value : null;
}

/** Shared /passport links, including checkout returns, open Tickets. */
export default function PassportRedirect() {
  const params = useLocalSearchParams<{ checkout?: string; tier?: string; session_id?: string }>();
  return (
    <Redirect
      href={ticketsLocation({
        checkout: text(params.checkout),
        tier: text(params.tier),
        session_id: text(params.session_id),
      })}
    />
  );
}
