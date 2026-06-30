// Google OAuth2 (Authorization Code) helpers — pure fetch, no SDK.
// Scope `gmail.send` lets us send mail AS the user via their OAuth token,
// without ever seeing their password.

const AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";

const SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/gmail.send",
];

export function googleConfigured(): boolean {
  return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export function redirectUri(origin: string): string {
  return process.env.GOOGLE_REDIRECT_URI || `${origin}/api/google/callback`;
}

export function authUrl(origin: string, state: string): string {
  const p = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: redirectUri(origin),
    response_type: "code",
    scope: SCOPES.join(" "),
    access_type: "offline",   // ask for a refresh token
    prompt: "consent",         // force refresh_token on every connect
    include_granted_scopes: "true",
    state,
  });
  return `${AUTH_ENDPOINT}?${p.toString()}`;
}

export interface TokenResponse {
  access_token?: string;
  refresh_token?: string;
  id_token?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
}

export async function exchangeCode(code: string, origin: string): Promise<TokenResponse> {
  const body = new URLSearchParams({
    code,
    client_id: process.env.GOOGLE_CLIENT_ID!,
    client_secret: process.env.GOOGLE_CLIENT_SECRET!,
    redirect_uri: redirectUri(origin),
    grant_type: "authorization_code",
  });
  const res = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  return (await res.json()) as TokenResponse;
}

/** Exchange the stored refresh token for a fresh short-lived access token.
 *  Used to call the Gmail API (sending via gmail.send — SMTP would need the
 *  broader mail.google.com scope, which we deliberately avoid). */
export async function accessTokenFromRefresh(refreshToken: string): Promise<string> {
  const body = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    client_secret: process.env.GOOGLE_CLIENT_SECRET!,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });
  const res = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const json = (await res.json()) as { access_token?: string; error?: string; error_description?: string };
  if (!res.ok || !json.access_token) {
    // invalid_grant = the user revoked access or the token aged out → reconnect.
    throw new Error(json.error_description || json.error || "Could not refresh Google access token");
  }
  return json.access_token;
}

/** Pull the verified email address out of the id_token (a JWT). */
export function emailFromIdToken(idToken?: string): string | null {
  if (!idToken) return null;
  try {
    const parts = idToken.split(".");
    if (parts.length !== 3) return null;          // not a well-formed JWT
    const payload = JSON.parse(Buffer.from(parts[1], "base64").toString("utf8"));
    return typeof payload.email === "string" ? payload.email : null;
  } catch {
    return null;
  }
}
