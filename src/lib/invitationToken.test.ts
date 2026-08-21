import { describe, expect, it } from "vitest";
import { generateInvitationToken, hashInvitationToken } from "./invitationToken";

describe("generateInvitationToken", () => {
  it("generates distinct tokens", () => {
    const a = generateInvitationToken();
    const b = generateInvitationToken();
    expect(a).not.toEqual(b);
    expect(a.length).toBeGreaterThan(0);
  });
});

describe("hashInvitationToken", () => {
  it("is deterministic for the same input", async () => {
    const token = "a-fixed-token";
    expect(await hashInvitationToken(token)).toEqual(await hashInvitationToken(token));
  });

  it("differs for different input", async () => {
    expect(await hashInvitationToken("token-a")).not.toEqual(await hashInvitationToken("token-b"));
  });

  it("never returns the raw token", async () => {
    const token = "a-fixed-token";
    expect(await hashInvitationToken(token)).not.toEqual(token);
  });
});
