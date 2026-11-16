import { VipStartSheet } from "./VipStartSheet";

export function VipStart(props: {
  email?: string | null;
  name?: string | null;
  phone?: string | null;
  userId?: string | null;
  onClose: () => void;
  onLater?: () => void;
}) {
  return <VipStartSheet {...props} />;
}
