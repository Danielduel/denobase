import { SupabaseClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { updateEdgeFunctions } from "./sdk/updateEdgeFunctions.ts";

const envVars = await config();

export async function supabaseInit (adminClient: SupabaseClient, publicClient: SupabaseClient) {
  const supabaseAccessToken = Deno.env.get("SUPABASE_ACCESS_TOKEN") ?? envVars.SUPABASE_ACCESS_TOKEN;
  const supabaseProjectRef = Deno.env.get("SUPABASE_PROJECT_REF") ?? envVars.SUPABASE_PROJECT_REF;

  await updateEdgeFunctions({
    supabaseAccessToken,
    supabaseProjectRef
  });

  const supabasePublicKey = Deno.env.get("SUPABASE_API_PUBLIC") ?? envVars.SUPABASE_API_PUBLIC;
  const slug = "d15d6460615ec2eb411ddaa3fe9dd05be652acf109f1748bda5c9bb9060695e2c75a0f8661a5d78ba1eadf702f92cab690503e184f4cf02d99710f187f7ab6f4";
  const url = `https://${supabaseProjectRef}.functions.supabase.co/${slug}`;
  const response = await fetch(url, {
    method: "POST",
    body: JSON.stringify({ name: "Functions" }),
    headers: {
      Authorization: `Bearer ${supabasePublicKey}`,
      accept: "application/json",
      "Content-Type": "application/json"
    }
  });
  const text = await response.text();

  console.log(text);
}
