// Shared confirmation for the VisionBridge student fee. Used by BOTH the Paynow
// server-to-server callback (/api/vb/pay/result) and the client status poll
// (/api/vb/pay/status). Polls Paynow directly so the payment confirms even when
// Paynow can't reach the result URL. Grants access BEFORE marking the payment
// completed (idempotent) so a student never pays without getting access.
import type { SupabaseClient } from "@supabase/supabase-js";
import { pollStatus } from "@/lib/paynow";

export async function confirmVbPayment(
  admin: SupabaseClient,
  reference: string,
): Promise<{ status: "paid" | "pending" | "unknown" }> {
  if (!reference) return { status: "unknown" };

  const { data: pay } = await admin
    .from("vb_payments").select("*").eq("reference", reference).maybeSingle();
  if (!pay) return { status: "unknown" };
  if (pay.status === "completed") return { status: "paid" };
  if (!pay.paynow_poll_url) return { status: "pending" };

  const { paid } = await pollStatus(pay.paynow_poll_url);
  if (!paid) return { status: "pending" };

  // Grant access first, then mark paid last (both idempotent).
  await admin.from("vb_profiles").update({ paid: true }).eq("id", pay.student_id);
  await admin.from("vb_payments").update({ status: "completed" }).eq("reference", reference);
  try {
    await admin.from("vb_notifications").insert({
      user_id: pay.student_id,
      body: "Payment received — your registration is confirmed. Start browsing opportunities.",
      link: "/student",
      read: false,
    });
  } catch { /* notification is best-effort */ }

  return { status: "paid" };
}
