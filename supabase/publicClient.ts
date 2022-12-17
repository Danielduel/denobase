import { createClient, Session } from "@supabase/supabase-js";
import type { SupabasePublicClientCreds } from "./sdk/types.ts";

export type SupabaseAuthSession = Session;

export const getPublicClient = ({
  supabaseProjectUrl,
  supabasePublicKey,
}: SupabasePublicClientCreds) =>
  createClient(
    supabaseProjectUrl,
    supabasePublicKey,
  );

export const getOAuthRedirectUrl = () => (
  `${location.origin}/auth/oauthreceiver?href=${location.href}`
);
