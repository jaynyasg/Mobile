export type BookingContactField = "hostName" | "hostEmail" | "hostPhone";
export type BookingContactErrors = Partial<Record<BookingContactField, string>>;

/** Shared by the form and API: an incomplete host cannot create a booking. */
export function bookingContactErrors(input: Record<BookingContactField, unknown>): BookingContactErrors {
  const name = typeof input.hostName === "string" ? input.hostName.trim() : "";
  const email = typeof input.hostEmail === "string" ? input.hostEmail.trim() : "";
  const phone = typeof input.hostPhone === "string" ? input.hostPhone.trim() : "";
  const errors: BookingContactErrors = {};
  if (name.length < 2 || name.length > 120) errors.hostName = "Enter your name (2–120 characters).";
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.hostEmail = "Enter a valid email address.";
  const digits = phone.replace(/\D/g, "");
  if (!/^\+?[\d\s().-]+$/.test(phone) || digits.length < 7 || digits.length > 15 || phone.length > 32) errors.hostPhone = "Enter a valid phone number, including your country code.";
  return errors;
}
