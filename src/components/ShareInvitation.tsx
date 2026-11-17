import { useState } from "react";
import { Pressable } from "react-native";
import { colors } from "@/theme";
import { T } from "./Text";
export function ShareInvitation() {
  const [status, setStatus] = useState("");
  async function share() {
    const text = "Join TATEL: a four-day Technology Mill across the Virgin Islands. Identify, plan, build and test, then showcase and expand. January 26–29, 2027.";
    try {
      if (typeof navigator !== "undefined" && navigator.share) await navigator.share({ title: "TATEL · Make waves. Make it matter.", text, url: "https://tatel.app/" });
      else if (typeof navigator !== "undefined" && navigator.clipboard) { await navigator.clipboard.writeText(`${text}\nhttps://tatel.app/`); setStatus("Invitation copied. Share it with someone you'd love to bring."); }
      else setStatus("Share this address: https://tatel.app/");
    } catch (error) { if (!(error instanceof Error && error.name === "AbortError")) setStatus("Share this address: https://tatel.app/"); }
  }
  return <><Pressable accessibilityRole="button" onPress={() => void share()} style={{ minHeight: 48, justifyContent: "center" }}><T variant="button" color={colors.gold}>Share the TATEL invitation</T></Pressable>{status ? <T variant="small" accessibilityLiveRegion="polite">{status}</T> : null}</>;
}
