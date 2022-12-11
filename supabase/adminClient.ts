import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { supabaseInit } from "./init.ts";
import { getSupabaseCookies } from "./cookie.ts";

const envVars = await config();
const supabaseUrl = Deno.env.get("SUPABASE_DB_URI") ?? envVars.SUPABASE_DB_URI;
const supabaseServiceKey = Deno.env.get("SUPABASE_API_ADMIN") ?? envVars.SUPABASE_API_ADMIN;
const supabasePublicKey = Deno.env.get("SUPABASE_API_PUBLIC") ?? envVars.SUPABASE_API_PUBLIC;

export const adminClient = createClient(
  supabaseUrl,
  supabaseServiceKey,
);

export const setAdminSupabaseSessionBasedOnCookies = async (headers: Headers) => {
  const cookies = getSupabaseCookies(headers);
  if (cookies.sbToken && cookies.sbRefresh) {
    return await adminClient.auth.setSession({
      access_token: cookies.sbToken,
      refresh_token: cookies.sbRefresh
    });
  }
  return { data: { user: null, session: null }, error: "cookies" };
}
  
export const getPublicSupabaseCreds = () => {
  return {
    supabaseUrl,
    supabasePublicKey
  };
}

await supabaseInit(adminClient);
