import { PageProps } from "$fresh/server.ts";
import SupabaseOAuthReceiver from "../../islands/SupabaseOAuthReceiver.tsx";
import { Link } from "../../components/Link.tsx";
import { getPublicSupabaseCreds } from "../../supabase/adminClient.ts";

export default function ({ url }: PageProps) {
  const creds = getPublicSupabaseCreds();
  const redirectTo = url.searchParams.get("href");
  return (
    <>
      <SupabaseOAuthReceiver supabaseCreds={creds} redirectTo={redirectTo ?? undefined} />
      <Link href={url.searchParams.get("href") ?? "/"}>Click here if you see this screen for too long</Link>
    </>
  );
}
