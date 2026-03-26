import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables.\n" +
    "Copy .env.example → .env.local and fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

// ─── Waitlist ─────────────────────────────────────────────────────────────────

export async function joinWaitlist(walletAddress: string): Promise<{ error: string | null }> {
  const normalized = walletAddress.toLowerCase().trim();

  const { error } = await supabase
    .from("waitlist")
    .insert({ wallet_address: normalized });

  if (error) {
    if (error.code === "23505") {
      return { error: "duplicate" };
    }
    console.error("Waitlist insert error:", error.message);
    return { error: "unknown" };
  }

  return { error: null };
}

export async function getWaitlistCount(): Promise<number> {
  const { count, error } = await supabase
    .from("waitlist")
    .select("*", { count: "exact", head: true });

  if (error) return 0;
  return count ?? 0;
}
