import { Modal, Pressable, View } from "react-native";
import { openBrowserAsync } from "expo-web-browser";
import { T } from "./Text";
import { providerPreview } from "@/logic/providerPreview";
export interface ProviderPreviewProps { href: string; name: string; detail?: string; onClose: () => void; onConfirmed?: () => void }
export function ProviderPreview({ href, name, detail, onClose, onConfirmed }: ProviderPreviewProps) {
  const provider = providerPreview(href);
  return <Modal visible onRequestClose={onClose}><View style={{ padding: 24, gap: 18, flex: 1, backgroundColor: "#071421" }}>
    <T variant="title">{name}</T><T variant="small">{detail}</T>
    <T variant="small">Your plan stays in TATEL. Only save a reservation after the provider confirms it.</T>
    {provider ? <Pressable accessibilityRole="button" onPress={() => void openBrowserAsync(provider.href)}><T>Open provider</T></Pressable> : <T>Provider unavailable</T>}
    {onConfirmed ? <Pressable accessibilityRole="button" onPress={() => { onConfirmed(); onClose(); }}><T>I have a confirmed reservation</T></Pressable> : null}
    <Pressable accessibilityRole="button" onPress={onClose}><T>Back to TATEL</T></Pressable>
  </View></Modal>;
}
