import { config } from "dotenv";
import { updateSecrets } from "./supabase/sdk/updateSecrets.ts";

const envVars = await config();
const supabaseProjectRef = Deno.env.get("SUPABASE_PROJECT_REF") ?? envVars.SUPABASE_PROJECT_REF;
const supabaseAccessToken = Deno.env.get("SUPABASE_ACCESS_TOKEN") ?? envVars.SUPABASE_ACCESS_TOKEN;

const secrets = await config({ path: ".supabase.env" });

await updateSecrets({
  supabaseAccessToken,
  supabaseProjectRef,
  secretEntries: Object.entries(secrets).map(([name, value]) => ({ name, value })),
});
