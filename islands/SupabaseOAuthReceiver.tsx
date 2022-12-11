import { getPublicClient, SupabaseCreds } from "../supabase/publicClient.ts"

type SupabaseOAuthReceiverProps = {
  supabaseCreds: SupabaseCreds;
  redirectTo?: string;
}

const SupabaseOAuthReceiver: preact.FunctionComponent<SupabaseOAuthReceiverProps> = ({ supabaseCreds, redirectTo }) => {
  const publicSupabaseClient = getPublicClient(supabaseCreds);
  publicSupabaseClient.auth.getSession()
    .then(({ data: { session }}) => {
      if (session) {
        const maxAge = 100 * 365 * 24 * 60 * 60 // 100 years, never expires
        document.cookie = `sbToken=${session.access_token}; path=/; max-age=${maxAge}; SameSite=Lax; secure`
        document.cookie = `sbRefresh=${session.refresh_token}; path=/; max-age=${maxAge}; SameSite=Lax; secure`
        if (redirectTo) {
          location.assign(redirectTo);
        }
      }
    });
  
  return <div>Waiting for authentication</div>;
}

export default SupabaseOAuthReceiver;
