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
    additionalinfo: `Appyto subscription ${a.reference}`,
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

const PAID_STATES = new Set(["paid", "awaiting delivery", "delivered"]);

export async function pollStatus(pollUrl: string): Promise<{ paid: boolean; status: string }> {
  const res = await fetch(pollUrl, { method: "POST" });
  const data = parsePaynow(await res.text());
  const status = (data.status ?? "").toLowerCase();
  return { paid: PAID_STATES.has(status), status };
}
