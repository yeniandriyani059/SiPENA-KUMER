import { createClient } from "@supabase/supabase-js";
import { supabase, SUPABASE_URL, SUPABASE_ANON_KEY } from "./lib/supabase";

export { supabase, SUPABASE_URL, SUPABASE_ANON_KEY, createClient };
export default supabase;
