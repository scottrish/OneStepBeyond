// docs/features/supporter-invitation-feature-spec-v0.1.md §16 Security
// Requirements — the raw token exists only in the constructed link,
// never persisted; only its hash (support_relationships.token_hash) is
// stored, so reading the database never reveals a usable token. Web
// Crypto is already available in every supported browser — no new
// dependency for either the random token or the hash.
export function generateInvitationToken(): string {
  return crypto.randomUUID();
}

export async function hashInvitationToken(token: string): Promise<string> {
  const data = new TextEncoder().encode(token);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
