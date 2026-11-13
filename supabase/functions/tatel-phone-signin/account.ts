export interface PhoneIdentity {
  id: string;
  email: string | null;
  phone: string | null;
}

export type PhoneDecision =
  | { ok: true; mode: "existing"; userId: string; sessionEmail: string; phone: string }
  | { ok: true; mode: "create"; sessionEmail: string; phone: string }
  | { ok: false; reason: "mismatch" };

export function phoneDigits(value: string | null | undefined): string {
  if (!value) return "";
  return value.replace(/\D/g, "");
}

export function samePhone(left: string | null | undefined, right: string | null | undefined): boolean {
  const a = phoneDigits(left);
  const b = phoneDigits(right);
  return a.length >= 8 && a === b;
}

/**
 * The verified phone picks the account. The typed email never does.
 * An email that already belongs to someone else, or to an account whose stored phone is different, is a refusal.
 */
export function decidePhoneAccount(input: {
  verifiedPhone: string;
  enteredEmail: string;
  contact: PhoneIdentity | null;
  authPhone: PhoneIdentity | null;
  emailAccount: PhoneIdentity | null;
}): PhoneDecision {
  if (!/^\+[1-9]\d{7,14}$/.test(input.verifiedPhone)) return { ok: false, reason: "mismatch" };
  if (input.contact && input.authPhone && input.contact.id !== input.authPhone.id) {
    return { ok: false, reason: "mismatch" };
  }
  const phoneAccount = input.contact ?? input.authPhone;
  const emailAccount = input.emailAccount;
  if (emailAccount) {
    const ownsVerifiedPhone = samePhone(emailAccount.phone, input.verifiedPhone) || phoneAccount?.id === emailAccount.id;
    if (!ownsVerifiedPhone || (phoneAccount && phoneAccount.id !== emailAccount.id)) {
      return { ok: false, reason: "mismatch" };
    }
  }
  const account = phoneAccount ?? (emailAccount && samePhone(emailAccount.phone, input.verifiedPhone) ? emailAccount : null);
  if (account) {
    const sessionEmail = account.email?.trim().toLowerCase() || input.enteredEmail;
    if (!sessionEmail) return { ok: false, reason: "mismatch" };
    return { ok: true, mode: "existing", userId: account.id, sessionEmail, phone: input.verifiedPhone };
  }
  if (emailAccount) return { ok: false, reason: "mismatch" };
  return { ok: true, mode: "create", sessionEmail: input.enteredEmail, phone: input.verifiedPhone };
}
