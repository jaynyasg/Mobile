import { describe, expect, it } from "vitest";
import { stampToken } from "../src/logic/stampToken";
import { handleStampRequest } from "./stamps";

describe("stamp verification", () => {
  it("accepts a signed island token and hides posters without the admin header", async () => {
    const secret = "worker-test-secret";
    const token = await stampToken(secret, "ai");
    const ok = await handleStampRequest(new Request("https://tatel.app/api/stamps/verify", {
      method: "POST",
      body: JSON.stringify({ code: token }),
    }), { STAMP_SIGNING_SECRET: secret });
    expect(ok?.status).toBe(200);
    expect(await ok?.json()).toEqual({ ok: true, islandId: "ai" });
    const forged = await handleStampRequest(new Request("https://tatel.app/api/stamps/verify", {
      method: "POST",
      body: JSON.stringify({ code: "ai.not-a-real-code" }),
    }), { STAMP_SIGNING_SECRET: secret });
    expect(forged?.status).toBe(401);
    const hidden = await handleStampRequest(new Request("https://tatel.app/api/stamps/posters"), { STAMP_SIGNING_SECRET: secret });
    expect(hidden?.status).toBe(404);
    const posters = await handleStampRequest(new Request("https://tatel.app/api/stamps/posters", {
      headers: { "x-stamp-admin": secret },
    }), { STAMP_SIGNING_SECRET: secret });
    expect(posters?.status).toBe(200);
    const body = await posters?.json() as { codes: { islandId: string }[] };
    expect(body.codes.map((item) => item.islandId)).toEqual(["tech", "ai", "travel", "entertainment", "law"]);
    expect(JSON.stringify(body)).not.toContain(secret);
  });
});
