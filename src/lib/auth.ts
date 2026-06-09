// Server-side auth helper. Returns the user-scoped Supabase client + the user
// (or null). Routes/pages call this, then either proceed or 401/redirect.
import { supabaseServer } from "./supabase/server";

export async function getAuth() {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  return { sb, user };
}
