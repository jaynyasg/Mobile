import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Image, Platform, Pressable, ScrollView, StyleSheet, View, type ViewStyle } from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PassCheckout } from "@/components/PassCheckout";
import { QrMark } from "@/components/QrMark";
import { T } from "@/components/Text";
import { useAuth } from "@/community/auth";
import { useContent } from "@/content/provider";
import { readContactPrefs } from "@/logic/contactPrefs";
import { notePassPurchased, readIntake, writeIntake } from "@/logic/intake";
import { ticketGuide } from "@/content/tickets";
import { Disclosure } from "@/components/Disclosure";
import { checkoutStartTier } from "@/logic/ticketsRoute";
import { readOwnedPass, writeOwnedPass } from "@/logic/ownedPass";
import { CHECKOUT_SOON, confirmedPayment, canEmbedCheckout, passOffer, passTier, type PassTier } from "@/logic/passPay";
import { passPayload } from "@/logic/state";
import { useApp } from "@/store";
import { webStorage } from "@/welcome";
import { VipStart } from "@/components/VipStart";
import { colors, sceneForIsland } from "@/theme";
import { dockClearance } from "@/components/Dock";
import { notchPadding } from "@/components/notch";
import { scrollPort } from "@/components/scrollPort";
import { nightGlass } from "@/components/nightGlass";
import { StepBridge } from "@/components/StepBridge";
import { useTicketContinuation } from "@/logic/useTicketContinuation";

function readCheckoutQuery(params: { checkout?: string | string[]; tier?: string | string[]; session_id?: string | string[] }) {
  const fromRouter = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) ?? null;
  return { checkout: fromRouter(params.checkout), tier: fromRouter(params.tier), sessionId: fromRouter(params.session_id) };
}

function readHold(): { owned: boolean; tier: PassTier | null } {
  const tier = readOwnedPass(webStorage());
  const intake = readIntake(webStorage());
  const answered = intake?.hasPass === "have";
  return { owned: answered || tier != null, tier: tier ?? (answered ? intake.ticketPreference ?? null : null) };
}

export default function TicketsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { program } = useContent();
  const { email, userId } = useAuth();
  const { state } = useApp();
  const continueAfterTicket = useTicketContinuation();
  const params = useLocalSearchParams<{ checkout?: string; tier?: string; session_id?: string }>();
  const checkoutQuery = readCheckoutQuery(params);
  const requestedTier = checkoutStartTier(checkoutQuery);
  const { passes } = program;
  const recommended = passTier(params.tier) ?? readIntake(webStorage())?.ticketPreference;
  const [passId, setPassId] = useState(() => readHold().tier ?? recommended ?? passes.items[0]?.id ?? "");
  const [shown, setShown] = useState(false);
  const [hold, setHold] = useState(readHold);
  const [paying, setPaying] = useState<PassTier | null>(requestedTier !== "vip" ? requestedTier : null);
  const [starting, setStarting] = useState(requestedTier === "vip");
  const [booked, setBooked] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [catalog, setCatalog] = useState(false);
  const pass = passes.items.find((item) => item.id === passId) ?? passes.items[0];

  const refreshHold = useCallback(() => setHold(readHold()), []);

  useFocusEffect(useCallback(() => {
    refreshHold();
  }, [refreshHold]));

  useEffect(() => {
    if (!requestedTier) return;
    setStarting(requestedTier === "vip");
    setPaying(requestedTier === "vip" ? null : requestedTier);
    setCancelled(false);
  }, [requestedTier, checkoutQuery.checkout]);

  function closeCheckout() {
    setPaying(null);
    setStarting(false);
    if (requestedTier) router.replace({ pathname: "/tickets", params: { tier: requestedTier } });
  }

  function bookLater() {
    setPaying(null);
    setStarting(false);
    setCancelled(false);
    router.setParams({ checkout: undefined, session_id: undefined });
    continueAfterTicket();
  }

  useEffect(() => {
    if (!booked) return;
    notePassPurchased(webStorage());
    refreshHold();
    router.setParams({ checkout: undefined, session_id: undefined });
    const timer = setTimeout(() => {
      setBooked(false);
      continueAfterTicket();
    }, 1600);
    return () => clearTimeout(timer);
  }, [booked, continueAfterTicket, refreshHold, router]);

  useEffect(() => {
    if (checkoutQuery.checkout !== "return" || !checkoutQuery.sessionId) return;
    let live = true;
    fetch(`/api/checkout/status?session_id=${encodeURIComponent(checkoutQuery.sessionId)}`)
      .then((response) => response.ok ? response.json() : {})
      .then((body: { status?: string; paymentStatus?: string | null; tier?: string | null }) => {
        if (!live) return;
        if (confirmedPayment(body)) {
          const tier = passTier(body.tier);
          if (tier) writeOwnedPass(webStorage(), tier);
          setBooked(true);
        } else setCancelled(true);
      })
      .catch(() => {
        if (live) setCancelled(true);
      });
    return () => {
      live = false;
    };
  }, [checkoutQuery.checkout, checkoutQuery.sessionId]);

  const checkoutReady = canEmbedCheckout();

  function buy(id: string) {
    const tier = passTier(id);
    if (!tier || (tier !== "vip" && !checkoutReady)) return;
    const intake = readIntake(webStorage());
    if (intake) writeIntake(webStorage(), { ...intake, ticketPreference: tier });
    if (tier === "vip") {
      setStarting(true);
      return;
    }
    setPassId(id);
    setCancelled(false);
    setPaying(tier);
  }

  function claim(id: string) {
    const tier = passTier(id);
    if (!tier) return;
    writeOwnedPass(webStorage(), tier);
    setPassId(id);
    refreshHold();
  }

  if (!pass) return null;
  const payingPass = passes.items.find((item) => item.id === paying);
  const heldPass = hold.owned && hold.tier
    ? passes.items.find((item) => item.id === hold.tier)
    : null;

  return (
    <View style={styles.frame}>
      <Image source={{ uri: sceneForIsland("Jost Van Dyke") }} style={styles.photo} resizeMode="cover" accessibilityIgnoresInvertColors />
      <ScrollView style={[scrollPort, { marginBottom: dockClearance(insets.bottom) }]} contentContainerStyle={[{ paddingBottom: 28 }, notchPadding("top", 16, insets.top)]}>
        <View style={styles.intro}>
          <T variant="eyebrow" color={colors.gold}>Tickets</T>
          <T variant="title" color={colors.foam}>{hold.owned ? "Your ticket" : "Three ways to join us"}</T>
          <T variant="small" color={colors.foam}>
            {hold.owned ? "Your ticket selection is saved on this device. Keep your booking confirmation for check-in." : "Stay ashore, travel by day charter, or make a yacht your home. Compare the details below before you book."}
          </T>
        </View>
        {heldPass ? (
          <View style={styles.hero}>
            <T variant="rowTitle" color={colors.foam}>{ticketGuide[passTier(heldPass.id) ?? "beach"].name}</T>
            <T variant="small" color={colors.foam}>{heldPass.price} {heldPass.unit}</T>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={shown ? "Hide ticket" : "Show ticket"}
              onPress={() => setShown((open) => !open)}
              style={styles.pill}
            >
              <T variant="button" color={colors.ink}>{shown ? "Hide ticket" : "Show ticket"}</T>
            </Pressable>
          </View>
        ) : null}
        {heldPass && shown ? (
          <View style={styles.qr}>
            <QrMark value={passPayload(heldPass.id)} />
            <T variant="meta" color={colors.foam}>Your saved ticket selection. Bring your booking confirmation for check-in.</T>
          </View>
        ) : null}
        {hold.owned ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={catalog ? "Hide other tickets" : "See other tickets"}
            onPress={() => setCatalog((open) => !open)}
            style={styles.more}
          >
            <T variant="button" color={colors.ink}>{catalog ? "Hide other tickets" : "See other tickets"}</T>
          </Pressable>
        ) : null}
        {!hold.owned || catalog ? (
        <View style={styles.passes}>
          {[...passes.items].sort((a, b) => Number(b.id === recommended) - Number(a.id === recommended)).map((item) => {
            const offer = passOffer(item.id, item.price);
            const tier = passTier(item.id);
            const guide = tier ? ticketGuide[tier] : null;
            const ownsThis = hold.owned && hold.tier === item.id;
            const canBook = item.id === "vip" || checkoutReady;
            return (
              <View key={item.id} style={[styles.passCard, item.id === recommended && styles.recommended]} testID={`ticket-${item.id}`}>
                <Image source={{ uri: item.id === "beach" ? "/reels/venues.jpg" : item.id === "boat" ? "/reels/transport.jpg" : "/reels/pass.jpg" }} style={{ height: 150, width: "100%", borderRadius: 8 }} resizeMode="cover" />
                {item.id === recommended && !hold.owned ? <T variant="eyebrow" color={colors.gold}>Suggested for your travel style</T> : null}
                <T variant="title" color={colors.foam}>{guide?.name ?? item.name}</T>
                {guide ? <T variant="rowTitle" color={colors.gold}>{guide.tagline}</T> : null}
                <T variant="headline" color={colors.foam}>{item.price} <T variant="small" color={colors.foam}>per guest</T></T>
                {item.id === "vip" ? <T variant="meta" color={colors.gold}>{offer.guests} · {offer.total} for the full boat</T> : null}
                <T variant="small" color={colors.foam}>{item.id === "beach" ? "Land-based sessions. Book your own stay and public ferries for visits to other islands." : item.id === "boat" ? "Travel to sessions by private day charter. Book your own stay ashore and travel to the dock." : "Five days with the yacht as home. Book a full boat for eight, or ask to share."}</T>
                {guide ? <Disclosure label={`What's included · ${guide.name}`}>
                  <T variant="small" color={colors.foam}>{guide.description}</T>
                  <T variant="eyebrow" color={colors.gold}>Where you stay</T>
                  <T variant="small" color={colors.foam}>{guide.stay}</T>
                  <T variant="eyebrow" color={colors.gold}>Getting between islands</T>
                  <T variant="small" color={colors.foam}>{guide.travel}</T>
                  <T variant="eyebrow" color={colors.gold}>Before you book</T>
                  <T variant="small" color={colors.foam}>{guide.details}</T>
                </Disclosure> : null}
                <Pressable
                key={item.id}
                accessibilityRole="button"
                accessibilityState={{ disabled: ownsThis ? false : !canBook }}
                accessibilityLabel={ownsThis ? `Your ${guide?.name ?? item.name} ticket` : canBook ? (item.id === "vip" ? "Start a Be on Board booking" : `Book ${guide?.name ?? item.name}`) : `${CHECKOUT_SOON}, ${guide?.name ?? item.name}`}
                disabled={ownsThis ? false : !canBook}
                onPress={() => {
                  if (ownsThis) {
                    setPassId(item.id);
                    setShown(true);
                    return;
                  }
                  buy(item.id);
                }}
                style={[styles.pill, !ownsThis && !canBook && styles.pillOff]}
              >
                  <T variant="button" color={colors.ink}>{ownsThis ? "View my ticket" : canBook ? (item.id === "vip" ? "Start a group booking" : `Book ${guide?.name ?? item.name}`) : CHECKOUT_SOON}</T>
              </Pressable>
              </View>
            );
          })}
        </View>
        ) : null}
        {hold.owned && !hold.tier ? <><T variant="small" style={styles.detail}>Select the ticket on your existing booking confirmation.</T><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.picks}>
          {passes.items.map((item) => {
            const current = item.id === pass.id;
            return (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                accessibilityLabel={hold.owned && !hold.tier ? `This is my ${item.name} ticket` : item.name}
                onPress={() => {
                  if (hold.owned && !hold.tier) claim(item.id);
                  else {
                    setPassId(item.id);
                  }
                }}
                style={[styles.pick, current && styles.pickOn]}
              >
                <T variant="meta" color={colors.foam}>{item.name}</T>
              </Pressable>
            );
          })}
        </ScrollView></> : null}
        <StepBridge id="pass" footer />
      </ScrollView>
      {paying && payingPass && paying !== "vip" ? (
        <PassCheckout
          tier={paying}
          title={ticketGuide[paying].name}
          detail={`${payingPass.price} ${payingPass.unit}`}
          email={email}
          preview={checkoutQuery.checkout === "preview"}
          onClose={closeCheckout}
          onLater={bookLater}
          onBooked={() => {
            writeOwnedPass(webStorage(), paying);
            closeCheckout();
            setBooked(true);
          }}
        />
      ) : null}
      {starting ? (
        <VipStart
          email={email}
          name={state.profile.name}
          phone={readContactPrefs(webStorage())?.phone ?? null}
          userId={userId}
          onClose={closeCheckout}
          onLater={bookLater}
        />
      ) : null}
      {booked ? (
        <TicketNotice label="You're booked">
          <ScrollView style={styles.notice} contentContainerStyle={styles.noticeContent}>
            <T variant="eyebrow" color={colors.gold}>Tickets</T>
            <T variant="title" color={colors.foam}>You're booked</T>
            <T variant="small" color={colors.foam}>Your payment is complete. We're taking you to the next step in your plan.</T>
            <StepBridge id="pass" footer onContinue={() => setBooked(false)} />
          </ScrollView>
        </TicketNotice>
      ) : null}
      {cancelled ? (
        <TicketNotice label="Check your payment">
          <ScrollView style={styles.notice} contentContainerStyle={styles.noticeContent}>
            <T variant="eyebrow" color={colors.gold}>Tickets</T>
            <T variant="title" color={colors.foam}>Check your payment</T>
            <T variant="small" color={colors.foam}>We couldn't confirm a completed payment. Check your confirmation email before trying again.</T>
            <Pressable accessibilityRole="button" accessibilityLabel="Close payment message" onPress={() => setCancelled(false)} style={styles.pill}>
              <T variant="button" color={colors.ink}>Close</T>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={bookLater} style={styles.pill}>
              <T variant="button" color={colors.ink}>I'll book my ticket later</T>
            </Pressable>
          </ScrollView>
        </TicketNotice>
      ) : null}
    </View>
  );
}

function TicketNotice({ label, children }: { label: string; children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const notice = <View style={[styles.overlay, notchPadding("top", 16, insets.top), notchPadding("bottom", 16, insets.bottom)]} accessibilityViewIsModal accessibilityLabel={label}>{children}</View>;
  return typeof document === "undefined" ? notice : createPortal(notice, document.body);
}

const styles = StyleSheet.create({
  frame: { flex: 1, minHeight: 0, backgroundColor: "#071421" },
  photo: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0 },
  intro: { marginHorizontal: 16, padding: 16, gap: 8, borderRadius: 22, ...nightGlass },
  passes: { marginHorizontal: 16, marginTop: 16, gap: 10 },
  passCard: { padding: 20, gap: 12, borderRadius: 22, ...nightGlass },
  recommended: { borderWidth: 2, borderColor: colors.gold },
  hero: { marginHorizontal: 16, marginTop: 16, padding: 16, gap: 8, borderRadius: 22, ...nightGlass },
  overlay: { ...({ position: Platform.OS === "web" ? "fixed" : "absolute" } as ViewStyle), top: 0, right: 0, bottom: 0, left: 0, zIndex: 120, backgroundColor: "#071421", justifyContent: "center", alignItems: "center", padding: 16 },
  notice: { width: "100%", maxWidth: 440, maxHeight: "90%", flexGrow: 0, borderRadius: 22, ...nightGlass, backgroundColor: "rgba(7,27,42,0.92)" },
  noticeContent: { padding: 18, gap: 12 },
  pill: { alignSelf: "flex-start", minHeight: 48, marginTop: 8, paddingHorizontal: 20, borderRadius: 999, alignItems: "center", justifyContent: "center", backgroundColor: colors.gold },
  pillOff: { opacity: 0.55 },
  qr: { alignItems: "center", gap: 10, marginHorizontal: 16, marginTop: 16, padding: 16, borderRadius: 18, ...nightGlass },
  picks: { paddingHorizontal: 16, gap: 8, paddingTop: 16 },
  pick: { minHeight: 44, paddingHorizontal: 14, borderRadius: 999, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,224,138,0.28)", ...nightGlass },
  pickOn: { borderColor: colors.gold },
  more: { alignSelf: "flex-start", minHeight: 44, marginLeft: 20, marginTop: 16, paddingHorizontal: 16, borderRadius: 999, alignItems: "center", justifyContent: "center", backgroundColor: colors.gold },
  detail: { marginHorizontal: 16, marginTop: 10, padding: 14, gap: 8, borderRadius: 18, ...nightGlass },
});
