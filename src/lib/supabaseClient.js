import { createClient } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from "./env";

export const createPortalSupabaseClient = (session) => {
  if (!isSupabaseConfigured) return null;

  return createClient(supabaseUrl, supabaseAnonKey, {
    async accessToken() {
      return session?.getToken() ?? null;
    },
  });
};

export const supabase = createPortalSupabaseClient(null);

export const interpreterDocumentBucket = "interpreter-documents";
