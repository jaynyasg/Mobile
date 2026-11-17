import { Link } from "expo-router";
import { Pressable, View } from "react-native";
import { Screen } from "@/components/Screen";
import { StackHeader } from "@/components/StackHeader";
import { T } from "@/components/Text";
import { nightGlass } from "@/components/nightGlass";
import { ShareInvitation } from "@/components/ShareInvitation";
import { colors } from "@/theme";
const updates = [
  { title: "The work connects across four days", body: "January 26–29, 2027: identify the problem, shape the solution, build and test, then showcase and expand. Follow linked sessions and record the next steps in your work notebook.", href: "/program-overview" },
  { title: "Entertainment is near Tortola", body: "The Entertainment area is now near Tortola in the British Virgin Islands. The exact venue, landing point, and transfers are being confirmed. St. Croix is part of the wider destination story, not a summit stop.", href: "/pillar/entertainment" },
  { title: "Choose the island needs you care about", body: "Explore eight needs, from food and agriculture to ocean and climate, alongside Tech, AI, Travel, Entertainment, and Law. Your choices help you find connected sessions and places to stay.", href: "/agenda" },
] as const;
export default function UpdatesScreen() {
  return <Screen edge="none"><StackHeader title="TATEL updates" /><View style={{ margin: 16, padding: 18, gap: 12, borderRadius: 18, ...nightGlass }}><T variant="title">Keep the conversation moving.</T><T variant="small">Program notes · Updated November 16, 2026. Check the latest session details and provider confirmations as you plan.</T><ShareInvitation /></View>
    {updates.map(update => <View key={update.title} style={{ margin: 16, padding: 18, gap: 12, borderRadius: 18, ...nightGlass }}><T variant="title">{update.title}</T><T variant="small">{update.body}</T><Link href={update.href} asChild><Pressable accessibilityRole="button" style={{ minHeight: 48, justifyContent: "center" }}><T variant="button" color={colors.gold}>Explore this update</T></Pressable></Link></View>)}
    <View style={{ margin: 16, padding: 18, ...nightGlass }}><Link href="/community" asChild><Pressable accessibilityRole="button" style={{ minHeight: 48, justifyContent: "center" }}><T variant="button" color={colors.gold}>Talk about TATEL in Chat</T></Pressable></Link></View>
  </Screen>;
}
