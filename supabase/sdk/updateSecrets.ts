import type { SupabaseAPICreds } from "./types.ts";

type SecretEntry = {
  name: string;
  value: string;
};

async function getSecrets({
  supabaseAccessToken,
  supabaseProjectRef,
}: SupabaseAPICreds) {
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${supabaseProjectRef}/secrets`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${supabaseAccessToken}`,
        accept: "application/json",
      },
    },
  );
  return (await res.json()) as SecretEntry[];
}

async function postSecrets({
  secretEntries,
  supabaseAccessToken,
  supabaseProjectRef,
}: SupabaseAPICreds & { secretEntries: SecretEntry[] }) {
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${supabaseProjectRef}/secrets`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${supabaseAccessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(secretEntries),
    },
  );
  return await res.text();
}

async function deleteSecrets({
  secretNames,
  supabaseAccessToken,
  supabaseProjectRef,
}: SupabaseAPICreds & { secretNames: string[] }) {
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${supabaseProjectRef}/secrets`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${supabaseAccessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(secretNames),
    },
  );
  return res.text();
}

export async function updateSecrets(
  { supabaseAccessToken, supabaseProjectRef, secretEntries }:
    & SupabaseAPICreds
    & {
      secretEntries: SecretEntry[];
    },
) {
  const secrets = await getSecrets({ supabaseAccessToken, supabaseProjectRef });
  const secretNames = secrets.map((secret) => secret.name);
  await deleteSecrets({ secretNames, supabaseAccessToken, supabaseProjectRef });
  await postSecrets({ secretEntries, supabaseAccessToken, supabaseProjectRef });
}
