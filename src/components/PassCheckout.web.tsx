import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Pressable, StyleSheet, View, type ViewStyle } from "react-native";
import { CHECKOUT_SOON, stripePublishableKey, type PassTier } from "@/logic/passPay";
import { colors } from "@/theme";
import { nightGlass } from "./nightGlass";
import { T } from "./Text";

export function PassCheckout({
  tier,
  title,
  detail,
  email,
  preview = false,
  onClose,
  onBooked,
}: {
  tier: PassTier;
  title: string;
  detail: string;
  email?: string | null;
  preview?: boolean;
  onClose: () => void;
  onBooked: () => void;
}) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [message, setMessage] = useState<string | null>(preview ? null : "Opening checkout");

  useEffect(() => {
    if (preview) return;
    const node = mountRef.current;
    if (!node) return;
    let live = true;
    let checkout: { destroy: () => void } | null = null;
    (async () => {
      try {
        const { loadStripe } = await import("@stripe/stripe-js");
        const stripe = await loadStripe(stripePublishableKey());
        if (!stripe || !live) throw new Error("unavailable");
        const page = await stripe.createEmbeddedCheckoutPage({
          fetchClientSecret: async () => {
            const response = await fetch("/api/checkout", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ tier, email: email ?? undefined }),
            });
            if (!response.ok) throw new Error("unavailable");
            const body = (await response.json()) as { clientSecret?: string };
            if (!body.clientSecret) throw new Error("unavailable");
            return body.clientSecret;
          },
          onComplete: () => {
            if (live) onBooked();
          },
        });
        if (!live) {
          page.destroy();
          return;
        }
        checkout = page;
        page.mount(node);
        setMessage(null);
      } catch {
        if (!live) return;
        setMessage(CHECKOUT_SOON);
      }
    })();
    return () => {
      live = false;
      checkout?.destroy();
    };
  }, [email, onBooked, preview, tier]);

  const sheet = (
    <View style={styles.overlay} accessibilityViewIsModal accessibilityLabel="Checkout">
      <View style={styles.card}>
        <T variant="eyebrow" color={colors.gold}>Passes</T>
        <T variant="title" color={colors.foam}>{title}</T>
        <T variant="small" color={colors.foam}>{detail}</T>
        {preview ? <CheckoutMock /> : <View ref={mountRef as never} style={styles.mount} />}
        {message ? <T variant="meta" color={colors.foam}>{message}</T> : null}
        <Pressable accessibilityRole="button" accessibilityLabel="Close checkout" onPress={onClose} style={styles.close}>
          <T variant="button" color={colors.gold}>Close</T>
        </Pressable>
      </View>
    </View>
  );
  if (typeof document === "undefined") return sheet;
  return createPortal(sheet, document.body);
}

function CheckoutMock() {
  return (
    <View style={styles.mock}>
      <T variant="eyebrow" color={colors.gold}>Stripe Checkout</T>
      <T variant="meta" color={colors.foam}>Email</T>
      <View style={styles.field} />
      <T variant="meta" color={colors.foam}>Card</T>
      <View style={styles.field} />
      <View style={styles.pay}>
        <T variant="button" color={colors.ink}>Pay</T>
      </View>
    </View>
  );
}

const fixed = { position: "fixed" } as unknown as ViewStyle;

const styles = StyleSheet.create({
  overlay: {
    ...fixed,
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 120,
    backgroundColor: "#071421",
    justifyContent: "center",
    padding: 16,
  },
  card: { padding: 16, gap: 10, borderRadius: 22, ...nightGlass, backgroundColor: "rgba(7,27,42,0.92)" },
  mount: { minHeight: 420, borderRadius: 16, overflow: "hidden", backgroundColor: "#071421" },
  mock: { gap: 8, padding: 14, borderRadius: 16, backgroundColor: "#071421", borderWidth: 1, borderColor: "rgba(255,224,138,0.35)" },
  field: { height: 44, borderRadius: 10, backgroundColor: "rgba(245,241,232,0.08)", borderWidth: 1, borderColor: "rgba(255,224,138,0.28)" },
  pay: { minHeight: 48, borderRadius: 999, alignItems: "center", justifyContent: "center", backgroundColor: colors.gold },
  close: { minHeight: 44, alignItems: "center", justifyContent: "center" },
});
