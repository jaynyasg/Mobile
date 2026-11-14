import { getApps, initializeApp } from "firebase/app";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { firebaseWebConfig } from "./firebaseConfig";

export interface PhoneCodeRequest {
  confirm: (code: string) => Promise<string>;
}

/** Loads Firebase only for the text path. Returns a Firebase ID token after the code is confirmed. */
export async function requestPhoneCode(phone: string): Promise<PhoneCodeRequest> {
  if (typeof document === "undefined") throw new Error("Text codes are not available yet.");
  const app = getApps()[0] ?? initializeApp(firebaseWebConfig());
  const auth = getAuth(app);
  const container = document.createElement("div");
  container.setAttribute("data-tatel-recaptcha", "");
  container.style.cssText = "position:fixed;bottom:0;left:0;width:1px;height:1px;opacity:0;pointer-events:none;";
  document.body.appendChild(container);
  const verifier = new RecaptchaVerifier(auth, container, { size: "invisible" });
  try {
    const confirmation = await signInWithPhoneNumber(auth, phone, verifier);
    return {
      confirm: async (code: string) => {
        try {
          const credential = await confirmation.confirm(code);
          return credential.user.getIdToken();
        } finally {
          verifier.clear();
          container.remove();
        }
      },
    };
  } catch (error) {
    verifier.clear();
    container.remove();
    throw error;
  }
}
