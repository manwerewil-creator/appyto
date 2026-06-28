-- VisionBridge student fee → real Paynow. Store the poll URL so the payment can
-- be confirmed server-side (the same pattern as Feasters' payments table).
-- Idempotent. Run on production (ref ipcxdotvjfudtohzpnmy).
alter table public.vb_payments add column if not exists paynow_poll_url text;
