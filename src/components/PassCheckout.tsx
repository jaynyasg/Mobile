import type { PassTier } from "@/logic/passPay";

/** Embedded Checkout is the web path. Native does not open an outside payment page. */
export function PassCheckout(_props: {
  tier: PassTier;
  title?: string;
  detail?: string;
  email?: string | null;
  preview?: boolean;
  secretPath?: string;
  secretBody?: string;
  onClose: () => void;
  onBooked?: () => void;
}) {
  return null;
}
