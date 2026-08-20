import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config.js";

if (SUPABASE_URL.startsWith("YOUR_") || SUPABASE_ANON_KEY.startsWith("YOUR_")) {
  console.warn("VXCHAT: Configure js/config.js before using Supabase.");
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
