import { createClient, Session } from "@supabase/supabase-js";

export type SupabaseAuthSession = Session;

export type SupabaseCreds = {
  supabaseUrl: string;
  supabasePublicKey: string;
};

export const getPublicClient = ({
  supabaseUrl,
  supabasePublicKey,
}: SupabaseCreds) =>
  createClient(
    supabaseUrl,
    supabasePublicKey,
  );

export const getOAuthRedirectUrl = () => (
  `${location.origin}/auth/oauthreceiver?href=${location.href}`
);
