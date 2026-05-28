import { createClient } from "@supabase/supabase-js";

// Service-role client — bypasses RLS. Never import this in client components.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
