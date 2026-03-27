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
    if (error.code === "23505") return { error: "duplicate" };
    console.error("Waitlist insert error:", error.message);
    return { error: "unknown" };
  }
  return { error: null };
}

export async function getWaitlistEntry(walletAddress: string) {
  const normalized = walletAddress.toLowerCase().trim();
  const { data, error } = await supabase
    .from("waitlist")
    .select("*")
    .eq("wallet_address", normalized)
    .single();
  if (error && error.code !== "PGRST116") return null;
  return data ?? null;
}

export async function updateWaitlistProfile(
  walletAddress: string,
  updates: {
    x_handle?: string;
    email?: string;
    xp?: number;
    tasks_completed?: string[];
    tier?: string;
  }
): Promise<{ error: string | null }> {
  const normalized = walletAddress.toLowerCase().trim();
  const { error } = await supabase
    .from("waitlist")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("wallet_address", normalized);

  if (error) {
    console.error("Waitlist update error:", error.message);
    return { error: error.message };
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
