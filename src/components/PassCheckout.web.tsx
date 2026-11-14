import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Pressable, StyleSheet, View, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { checkoutDismissPlan, hasCheckoutMarker, holdCheckout, withCheckoutMarker } from "@/logic/checkoutDismiss";
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
  const insets = useSafeAreaInsets();
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [message, setMessage] = useState<string | null>(preview ? null : "Opening checkout");
  const dismiss = useCheckoutDismiss(onClose);

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
          try {
            page.destroy();
          } catch {
            // Already destroyed by a newer checkout.
          }
          return;
        }
        checkout = holdCheckout(page);
        page.mount(node);
        setMessage(null);
      } catch {
        if (!live) return;
        setMessage(CHECKOUT_SOON);
      }
    })();
    return () => {
      live = false;
      checkout = null;
      holdCheckout(null);
    };
  }, [email, onBooked, preview, tier]);

  const sheet = (
    <View style={styles.overlay} accessibilityViewIsModal accessibilityLabel="Checkout">
      <View style={[styles.bar, { paddingTop: Math.max(insets.top, 0) + 8 }, webNotch]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={dismiss} style={styles.barHit}>
          <T variant="button" color={colors.gold}>Back</T>
        </Pressable>
        <View style={styles.barTitle}>
          <T variant="small" color={colors.foam} numberOfLines={1}>{title}</T>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Close checkout" onPress={dismiss} style={styles.barHit}>
          <T variant="button" color={colors.gold} style={styles.mark}>✕</T>
        </Pressable>
      </View>
      <View style={[styles.scroll, webScroll]}>
        <View style={styles.card}>
          <T variant="eyebrow" color={colors.gold}>Passes</T>
          <T variant="title" color={colors.foam}>{title}</T>
          <T variant="small" color={colors.foam}>{detail}</T>
          {preview ? <CheckoutMock /> : <View ref={mountRef as never} style={styles.mount} />}
          {message ? <T variant="meta" color={colors.foam}>{message}</T> : null}
          <Pressable accessibilityRole="button" accessibilityLabel="Close checkout" onPress={dismiss} style={styles.close}>
            <T variant="button" color={colors.gold}>Close</T>
          </Pressable>
        </View>
      </View>
    </View>
  );
  if (typeof document === "undefined") return sheet;
  return createPortal(sheet, document.body);
}

function useCheckoutDismiss(onClose: () => void): () => void {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const armed = useRef(false);
  const dismissRef = useRef<() => void>(() => onClose());

  useEffect(() => {
    const history = window.history;
    history.pushState(withCheckoutMarker(history.state), "");
    armed.current = true;

    const finish = () => {
      if (!armed.current) return;
      armed.current = false;
      onCloseRef.current();
    };
    const dismiss = () => {
      if (!armed.current) return;
      if (checkoutDismissPlan(history.state) === "history") {
        history.back();
        return;
      }
      finish();
    };
    dismissRef.current = dismiss;

    const onPop = () => finish();
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      dismiss();
    };
    window.addEventListener("popstate", onPop);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("popstate", onPop);
      window.removeEventListener("keydown", onKey);
      if (!armed.current) return;
      armed.current = false;
      if (hasCheckoutMarker(history.state)) history.back();
    };
  }, []);

  return () => dismissRef.current();
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
const webNotch = {
  paddingTop: "calc(env(safe-area-inset-top, 0px) + 8px)",
  paddingLeft: "calc(env(safe-area-inset-left, 0px) + 4px)",
  paddingRight: "calc(env(safe-area-inset-right, 0px) + 4px)",
} as ViewStyle;
const webScroll = { overflowY: "auto", WebkitOverflowScrolling: "touch" } as unknown as ViewStyle;

const styles = StyleSheet.create({
  overlay: {
    ...fixed,
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 120,
    backgroundColor: "#071421",
  },
  bar: {
    flexShrink: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    zIndex: 3,
    backgroundColor: "#071B2A",
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,224,138,0.55)",
    ...({ position: "sticky", top: 0 } as unknown as ViewStyle),
  },
  barHit: { minWidth: 64, minHeight: 44, alignItems: "center", justifyContent: "center", paddingHorizontal: 8 },
  barTitle: { flex: 1, minWidth: 0 },
  mark: { fontSize: 22, lineHeight: 26 },
  scroll: { flex: 1, minHeight: 0, overflow: "scroll" },
  card: { margin: 12, padding: 16, gap: 10, borderRadius: 22, ...nightGlass, backgroundColor: "rgba(7,27,42,0.92)" },
  mount: { minHeight: 420, borderRadius: 16, overflow: "hidden", backgroundColor: "#071421" },
  mock: { gap: 8, padding: 14, borderRadius: 16, backgroundColor: "#071421", borderWidth: 1, borderColor: "rgba(255,224,138,0.35)" },
  field: { height: 44, borderRadius: 10, backgroundColor: "rgba(245,241,232,0.08)", borderWidth: 1, borderColor: "rgba(255,224,138,0.28)" },
  pay: { minHeight: 48, borderRadius: 999, alignItems: "center", justifyContent: "center", backgroundColor: colors.gold },
  close: { minHeight: 44, alignItems: "center", justifyContent: "center" },
});
