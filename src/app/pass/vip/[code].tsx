import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PassCheckout } from "@/components/PassCheckout";
import { T } from "@/components/Text";
import { dockClearance } from "@/components/Dock";
import { nightGlass } from "@/components/nightGlass";
import { useAuth } from "@/community/auth";
import { CHECKOUT_SOON, canEmbedCheckout } from "@/logic/passPay";
import { boatPreferenceLabel, money, timeLeftLine, TOTAL_DOLLARS, type BoatPreference, type BookingStatus } from "@/logic/vipGroup";
import { colors } from "@/theme";

interface BookingView {
  code: string;
  boatPreference: BoatPreference;
  status: BookingStatus;
  paidShares: number;
  reservedShares: number;
  remaining: number;
  deadline: string;
  progress: string;
}

export default function VipSharePage() {
  const insets = useSafeAreaInsets();
  const { email } = useAuth();
  const params = useLocalSearchParams<{ code?: string }>();
  const code = typeof params.code === "string" ? params.code : "";
  const [booking, setBooking] = useState<BookingView | null>(null);
  const [missing, setMissing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [paying, setPaying] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const checkoutReady = canEmbedCheckout();

  const load = useCallback(async () => {
    if (!code) return;
    try {
      const response = await fetch(`/api/vip-booking/${code}`);
      if (response.status === 404) {
        setMissing(true);
        setBooking(null);
        return;
      }
      if (!response.ok) {
        setMessage("This booking can't be loaded right now.");
        return;
      }
      const body = await response.json() as BookingView;
      setBooking(body);
      setMissing(false);
      setQuantity((current) => Math.min(Math.max(current, 1), Math.max(body.remaining, 1)));
    } catch {
      setMessage("This booking can't be loaded right now.");
    }
  }, [code]);

  useEffect(() => {
    if (!code) return;
    const search = typeof window === "undefined" ? null : new URLSearchParams(window.location.search);
    const sessionId = search?.get("session_id");
    if (search?.get("checkout") === "return" && sessionId) {
      fetch(`/api/checkout/status?session_id=${encodeURIComponent(sessionId)}`)
        .catch(() => undefined)
        .finally(() => { void load(); });
      return;
    }
    void load();
  }, [code, load]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const open = booking?.status === "open" && booking.remaining > 0;
  const shareBody = JSON.stringify({ quantity, email: email ?? undefined });

  return (
    <View style={styles.frame}>
      <ScrollView style={{ marginBottom: dockClearance(insets.bottom) }} contentContainerStyle={{ paddingTop: insets.top + 18, paddingHorizontal: 16, paddingBottom: 28, gap: 14 }}>
        <T variant="eyebrow" color={colors.gold}>STAY onboard</T>
        <T variant="title" color={colors.foam}>All-inclusive VIP</T>
        {missing ? <T variant="small" color={colors.foam}>This booking link doesn't match a group.</T> : null}
        {message ? <T variant="meta" color={colors.gold}>{message}</T> : null}
        {booking ? (
          <View style={styles.card}>
            {booking.status === "filled" ? <T variant="title" color={colors.foam}>Booking confirmed</T> : null}
            <T variant="small" color={colors.foam}>{booking.progress}</T>
            <T variant="meta" color={colors.gold}>{boatPreferenceLabel(booking.boatPreference)}</T>
            {booking.status === "open" ? <T variant="meta" color={colors.foam}>{timeLeftLine(booking.deadline, now)}</T> : null}
            {booking.reservedShares > 0 ? (
              <T variant="meta" color={colors.foam}>
                {booking.reservedShares === 1 ? "1 share is held at checkout." : `${booking.reservedShares} shares are held at checkout.`}
              </T>
            ) : null}
            {booking.status === "expired" ? <T variant="small" color={colors.foam}>The 14 days are over. Paid shares stay paid. The team follows up from here.</T> : null}
            {booking.status === "filled" ? <T variant="small" color={colors.foam}>All {money(TOTAL_DOLLARS)} is paid.</T> : null}
            {open ? (
              <View style={styles.stepper}>
                <Pressable accessibilityRole="button" accessibilityLabel="Fewer shares" onPress={() => setQuantity((value) => Math.max(1, value - 1))} style={styles.step}>
                  <T variant="button" color={colors.ink}>−</T>
                </Pressable>
                <T variant="small" color={colors.foam}>{quantity} {quantity === 1 ? "share" : "shares"} · {money(quantity * 5_000)}</T>
                <Pressable accessibilityRole="button" accessibilityLabel="More shares" onPress={() => setQuantity((value) => Math.min(booking.remaining, value + 1))} style={styles.step}>
                  <T variant="button" color={colors.ink}>+</T>
                </Pressable>
              </View>
            ) : null}
            {open ? (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ disabled: !checkoutReady }}
                accessibilityLabel={checkoutReady ? `Pay for ${quantity} shares` : CHECKOUT_SOON}
                disabled={!checkoutReady}
                onPress={() => setPaying(true)}
                style={[styles.pay, !checkoutReady && styles.off]}
              >
                <T variant="button" color={colors.ink}>{checkoutReady ? "Pay" : CHECKOUT_SOON}</T>
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </ScrollView>
      {paying && booking ? (
        <PassCheckout
          tier="vip"
          title="All-inclusive VIP"
          detail={`${quantity} ${quantity === 1 ? "share" : "shares"} · ${money(quantity * 5_000)}`}
          email={email}
          secretPath={`/api/vip-booking/${booking.code}/checkout`}
          secretBody={shareBody}
          onClose={() => setPaying(false)}
          onBooked={() => {
            setPaying(false);
            void load();
          }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { flex: 1, backgroundColor: "#071421" },
  card: { padding: 16, gap: 10, borderRadius: 22, ...nightGlass },
  stepper: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  step: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center", backgroundColor: colors.gold },
  pay: { minHeight: 48, borderRadius: 999, alignItems: "center", justifyContent: "center", backgroundColor: colors.gold },
  off: { opacity: 0.55 },
});
