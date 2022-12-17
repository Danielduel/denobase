import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { supabaseInit } from "./init.ts";
import { getSupabaseCookies } from "./cookie.ts";

const envVars = await config();
const supabaseProjectUrl = Deno.env.get("SUPABASE_URL") ?? envVars.SUPABASE_URL;
const supabaseFunctionsUrl = Deno.env.get("SUPABASE_FUNCTIONS_URL") ?? envVars.SUPABASE_FUNCTIONS_URL;
const supabaseDatabaseUrl = Deno.env.get("SUPABASE_DB_URI") ?? envVars.SUPABASE_DB_URI;
const supabaseServiceKey = Deno.env.get("SUPABASE_API_ADMIN") ?? envVars.SUPABASE_API_ADMIN;
const supabasePublicKey = Deno.env.get("SUPABASE_API_PUBLIC") ?? envVars.SUPABASE_API_PUBLIC;
const supabaseProjectRef = Deno.env.get("SUPABASE_PROJECT_REF") ?? envVars.SUPABASE_PROJECT_REF;
const supabaseAccessToken = Deno.env.get("SUPABASE_ACCESS_TOKEN") ?? envVars.SUPABASE_ACCESS_TOKEN;

export const adminClient = createClient(
  supabaseDatabaseUrl,
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
    supabaseProjectUrl,
    supabasePublicKey
  };
}

export const { edgeFunctionNameToSlugMapping } = await supabaseInit({
  supabaseAccessToken,
  supabaseProjectRef
});
