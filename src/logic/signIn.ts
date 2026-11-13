import { countryById, toE164 } from "./phone";

/**
 * Text codes stay off until Auth has an SMS provider.
 * Set EXPO_PUBLIC_SMS_ENABLED=1 and rebuild to show "Text me a code".
 */
export const SMS_ENABLED = process.env.EXPO_PUBLIC_SMS_ENABLED === "1";

export const SMS_UNAVAILABLE_MESSAGE = "Text codes are not available yet. We can email you a code instead.";

export type SignInChannel = "email" | "sms";

export function channelsOffered(smsEnabled: boolean): SignInChannel[] {
  return smsEnabled ? ["sms", "email"] : ["email"];
}

export function signInFields(email: string, countryId: string, national: string): { email: string; phone: string } | { error: string } {
  const trimmed = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return { error: "Enter a valid email." };
  const phone = toE164(countryById(countryId), national);
  if (!phone) return { error: "Enter a phone number for the selected country." };
  return { email: trimmed, phone };
}

export function isSixDigitCode(code: string): boolean {
  return /^\d{6}$/.test(code.trim());
}

export function errorText(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") return error.message;
  return "";
}

export function isSmsUnavailable(error: unknown): boolean {
  const message = errorText(error).toLowerCase();
  return message.includes("unsupported phone provider") || message.includes("sms not configured") || message.includes("sms provider");
}

export function emailOtpRequest(email: string): { email: string } {
  return { email: email.trim().toLowerCase() };
}

export function emailVerifyRequest(email: string, token: string): { email: string; token: string; type: "email" } {
  return { email: email.trim().toLowerCase(), token: token.trim(), type: "email" };
}

export function phoneOtpRequest(phone: string): { phone: string } {
  return { phone };
}

export function phoneVerifyRequest(phone: string, token: string): { phone: string; token: string; type: "sms" } {
  return { phone, token: token.trim(), type: "sms" };
}

/**
 * updateUser({ phone }) starts a phone-change SMS and does not store the number until that second code is verified.
 * With no SMS provider it fails. Email sign-in stores the number only in contact_prefs.
 */
export function phoneUpdateAfterEmail(): "contact_prefs" {
  return "contact_prefs";
}

export async function startEmailSignIn(
  deps: {
    quickSignIn: (email: string) => Promise<"session" | "code">;
    sendEmailCode: (email: string) => Promise<void>;
  },
  email: string,
): Promise<"session" | "code"> {
  const quick = await deps.quickSignIn(email);
  if (quick === "session") return "session";
  await deps.sendEmailCode(email);
  return "code";
}

export async function startPhoneSignIn(
  deps: { sendPhoneCode: (phone: string) => Promise<void> },
  phone: string,
): Promise<"code" | "sms-unavailable"> {
  try {
    await deps.sendPhoneCode(phone);
    return "code";
  } catch (error) {
    if (isSmsUnavailable(error)) return "sms-unavailable";
    throw error;
  }
}
