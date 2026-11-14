import { createPortal } from "react-dom";
import { VipStartSheet } from "./VipStartSheet";

export function VipStart(props: {
  email?: string | null;
  name?: string | null;
  phone?: string | null;
  userId?: string | null;
  onClose: () => void;
}) {
  const sheet = <VipStartSheet {...props} />;
  if (typeof document === "undefined") return sheet;
  return createPortal(sheet, document.body);
}
