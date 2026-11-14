import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { decidePhoneAccount, type PhoneIdentity } from "./account";

const phone = "+13405550100";
const other = "+13405550199";

function user(id: string, email: string | null, stored: string | null): PhoneIdentity {
  return { id, email, phone: stored };
}

describe("phone account choice", () => {
  it("signs in the account that already has the verified phone", () => {
    const contact = user("user-1", "ada@example.com", null);
    expect(decidePhoneAccount({
      verifiedPhone: phone,
      enteredEmail: "someone@example.com",
      contact,
      authPhone: null,
      emailAccount: null,
    })).toEqual({ ok: true, mode: "existing", userId: "user-1", sessionEmail: "ada@example.com", phone });

    expect(decidePhoneAccount({
      verifiedPhone: phone,
      enteredEmail: "ada@example.com",
      contact: null,
      authPhone: user("user-2", "ada@example.com", phone),
      emailAccount: user("user-2", "ada@example.com", phone),
    })).toMatchObject({ ok: true, mode: "existing", userId: "user-2" });
  });

  it("creates an account only when the email is unused", () => {
    expect(decidePhoneAccount({
      verifiedPhone: phone,
      enteredEmail: "new@example.com",
      contact: null,
      authPhone: null,
      emailAccount: null,
    })).toEqual({ ok: true, mode: "create", sessionEmail: "new@example.com", phone });
  });

  it("refuses an email that belongs to a different phone", () => {
    expect(decidePhoneAccount({
      verifiedPhone: phone,
      enteredEmail: "ada@example.com",
      contact: null,
      authPhone: null,
      emailAccount: user("user-1", "ada@example.com", other),
    })).toEqual({ ok: false, reason: "mismatch" });
    expect(decidePhoneAccount({
      verifiedPhone: phone,
      enteredEmail: "ada@example.com",
      contact: null,
      authPhone: null,
      emailAccount: user("user-1", "ada@example.com", null),
    })).toEqual({ ok: false, reason: "mismatch" });
    expect(decidePhoneAccount({
      verifiedPhone: phone,
      enteredEmail: "ada@example.com",
      contact: user("user-2", "other@example.com", phone),
      authPhone: null,
      emailAccount: user("user-1", "ada@example.com", other),
    })).toEqual({ ok: false, reason: "mismatch" });
  });

  it("keeps the edge function on the verified phone and the quick-signin mint", () => {
    const source = readFileSync("supabase/functions/tatel-phone-signin/index.ts", "utf8");
    expect(source).toContain("decidePhoneAccount");
    expect(source).toContain("verifyFirebaseIdToken");
    expect(source).toContain("contact_prefs");
    expect(source).toContain("generateLink");
    expect(source).toContain("verifyOtp");
    expect(source).toContain("type: 'magiclink'");
    expect(source).not.toContain("signInWithOtp");
  });
});
