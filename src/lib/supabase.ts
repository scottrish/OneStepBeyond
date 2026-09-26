import { createClient } from "@supabase/supabase-js";
import { reachabilityFetch } from "./networkStatus";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error("Missing Supabase environment variables");
}

// Every request notes whether it reached the server, and fails fast when
// the device is offline (PWA phase 2 — see ./networkStatus).
export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  global: { fetch: reachabilityFetch() },
});
