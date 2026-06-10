export const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || "";
export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
export const adminEmails = (import.meta.env.VITE_ADMIN_EMAILS || "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

export const isClerkConfigured = Boolean(clerkPublishableKey);
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
