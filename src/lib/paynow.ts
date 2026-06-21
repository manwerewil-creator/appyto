// Paynow (Zimbabwe) integration — web "Initiate Transaction" redirect flow.
// Pure fetch + crypto, no SDK. Docs: https://developers.paynow.co.zw/
//
// Flow:
//   1. createPayment() → POST to Paynow → returns { redirectUrl, pollUrl }.
//   2. Send the user to redirectUrl to pay (EcoCash, OneMoney, card…).
//   3. Paynow POSTs status to your resultUrl (server-to-server) AND the user
//      returns to returnUrl. Both call pollStatus(pollUrl) to confirm "Paid".

import crypto from "node:crypto";

const INITIATE_URL = "https://www.paynow.co.zw/interface/initiatetransaction";
const REMOTE_URL = "https://www.paynow.co.zw/interface/remotetransaction";

export type MobileMethod = "ecocash" | "onemoney" | "innbucks" | "telecash";

// Normalise a Zimbabwe mobile number to local "07XXXXXXXX" form (what Paynow
// express expects). Accepts +263.., 263.., 7######### and 07#########.
export function normalizeZwPhone(input: string): string {
  let p = (input || "").replace(/\D/g, "");
  if (p.startsWith("263")) p = "0" + p.slice(3);
  else if (p.length === 9 && p.startsWith("7")) p = "0" + p;
  return p;
}

export function isValidZwPhone(input: string): boolean {
  return /^07\d{8}$/.test(normalizeZwPhone(input));
}

function genHash(values: Record<string, string>, integrationKey: string): string {
  // SHA512 of all field values concatenated (in order) + the integration key.
  const concat = Object.values(values).join("") + integrationKey;
  return crypto.createHash("sha512").update(concat).digest("hex").toUpperCase();
}

function parsePaynow(body: string): Record<string, string> {
  const params = new URLSearchParams(body);
  const out: Record<string, string> = {};
  for (const [k, v] of params) out[k.toLowerCase()] = v;
  return out;
}

export interface CreatePaymentArgs {
  reference: string;       // your unique merchant reference
  amountUsd: number;
  authEmail: string;       // the paying user's email
  returnUrl: string;       // where the browser returns after payment
  resultUrl: string;       // server-to-server status callback
}

export async function createPayment(a: CreatePaymentArgs): Promise<{ redirectUrl: string; pollUrl: string }> {
  const id = process.env.PAYNOW_INTEGRATION_ID?.trim();
  const key = process.env.PAYNOW_INTEGRATION_KEY?.trim();
  if (!id || !key) throw new Error("Paynow not configured (PAYNOW_INTEGRATION_ID / KEY)");

  const fields: Record<string, string> = {
    id,
    reference: a.reference,
    amount: a.amountUsd.toFixed(2),
    additionalinfo: `Feasters subscription ${a.reference}`,
    returnurl: a.returnUrl,
    resulturl: a.resultUrl,
    authemail: a.authEmail,
    status: "Message",
  };
  const body = new URLSearchParams({ ...fields, hash: genHash(fields, key) }).toString();

  const res = await fetch(INITIATE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const data = parsePaynow(await res.text());
  if ((data.status ?? "").toLowerCase() !== "ok") {
    throw new Error(data.error || "Paynow initiation failed");
  }
  return { redirectUrl: data.browserurl, pollUrl: data.pollurl };
}

export interface MobilePaymentArgs extends CreatePaymentArgs {
  phone: string;            // payer's mobile-money number
  method: MobileMethod;     // ecocash | onemoney | innbucks | telecash
}

// Express checkout: pushes a mobile-money prompt to the payer's phone (no
// redirect to Paynow's hosted page). Returns a poll URL + on-screen instructions.
export async function createMobilePayment(
  a: MobilePaymentArgs,
): Promise<{ pollUrl: string; instructions: string }> {
  const id = process.env.PAYNOW_INTEGRATION_ID?.trim();
  const key = process.env.PAYNOW_INTEGRATION_KEY?.trim();
  if (!id || !key) throw new Error("Paynow not configured (PAYNOW_INTEGRATION_ID / KEY)");

  const phone = normalizeZwPhone(a.phone);
  if (!/^07\d{8}$/.test(phone)) throw new Error("Enter a valid mobile number, e.g. 0771234567.");

  const fields: Record<string, string> = {
    id,
    reference: a.reference,
    amount: a.amountUsd.toFixed(2),
    additionalinfo: `Feasters subscription ${a.reference}`,
    returnurl: a.returnUrl,
    resulturl: a.resultUrl,
    authemail: a.authEmail,
    phone,
    method: a.method,
    status: "Message",
  };
  const body = new URLSearchParams({ ...fields, hash: genHash(fields, key) }).toString();

  const res = await fetch(REMOTE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const data = parsePaynow(await res.text());
  if ((data.status ?? "").toLowerCase() !== "ok") {
    throw new Error(data.error || "Mobile payment could not be started. Check the number and try again.");
  }
  return {
    pollUrl: data.pollurl,
    instructions: data.instructions || "Approve the payment prompt on your phone to complete.",
  };
}

const PAID_STATES = new Set(["paid", "awaiting delivery", "delivered"]);

export async function pollStatus(pollUrl: string): Promise<{ paid: boolean; status: string }> {
  const res = await fetch(pollUrl, { method: "POST" });
  const data = parsePaynow(await res.text());
  const status = (data.status ?? "").toLowerCase();
  return { paid: PAID_STATES.has(status), status };
}
