import { SupabaseClient } from "@supabase/supabase-js";
import { toHashString } from "crypto/mod.ts";
import { config } from "dotenv";

const envVars = await config();
const functionsDir = "./supabase/functions";

type DeployedFunction = {
    verify_jwt: boolean;
    id: string;
    slug: string;
    name: string,
    version: number,
    status: "ACTIVE" | "",
    created_at: number,
    updated_at: number
};

type SupabaseCreds = {
  supabaseAccessToken: string;
  supabaseProjectRef: string;
};

const getDeployedFunctionsList = async ({
  supabaseAccessToken,
  supabaseProjectRef
}: SupabaseCreds) => {
  const res = await fetch(`https://api.supabase.com/v1/projects/${supabaseProjectRef}/functions`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${supabaseAccessToken}`
    }
  })
  return (await res.json()) as DeployedFunction[];
}

const deleteFunction = async ({
  slug,
  supabaseAccessToken,
  supabaseProjectRef
}: SupabaseCreds & { slug: string }) => {
  console.log(`Deleting ${slug}`)
  const res = await fetch(`https://api.supabase.com/v1/projects/${supabaseProjectRef}/functions/${slug}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${supabaseAccessToken}`,
      accept: "application/json",
      // "Content-Type": "application/json"
    }
  })
  console.log(`${res.statusText} delete ${slug}`);
  return res.statusText;
}

const createFunction = async ({
  slug,
  name,
  body,
  verify_jwt,
  supabaseAccessToken,
  supabaseProjectRef
}: SupabaseCreds & { name: string; slug: string; body: string; verify_jwt: boolean; }) => {
  const res = await fetch(`https://api.supabase.com/v1/projects/${supabaseProjectRef}/functions`, {
    method: "POST",
    body: JSON.stringify({
      slug,
      name,
      body,
      verify_jwt
    }),
    headers: {
      Authorization: `Bearer ${supabaseAccessToken}`,
      accept: "application/json",
      "Content-Type": "application/json"
    }
  })
  return await res.json();
}

export async function supabaseInit (adminClient: SupabaseClient) {
  const supabaseAccessToken = Deno.env.get("SUPABASE_ACCESS_TOKEN") ?? envVars.SUPABASE_ACCESS_TOKEN;
  const supabaseProjectRef = Deno.env.get("SUPABASE_PROJECT_REF") ?? envVars.SUPABASE_PROJECT_REF;
  
  const localFunctionNames = [...Deno.readDirSync(functionsDir)]
    .filter(entry => entry.isDirectory)
    .map(entry => entry.name);

  const deployedFunctions = await getDeployedFunctionsList({
    supabaseAccessToken,
    supabaseProjectRef
  });

  const statuses = await Promise.all(deployedFunctions.map(func => deleteFunction({
    slug: func.slug,
    supabaseAccessToken,
    supabaseProjectRef
  })));
  console.log(statuses);

  const test = await createFunction({
    name: "test",
    slug: "test",
    body: "test",
    verify_jwt: true,
    supabaseAccessToken,
    supabaseProjectRef
  })

  console.log(test);

}
