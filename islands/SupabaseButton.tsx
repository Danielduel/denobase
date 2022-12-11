import { useCallback } from "preact/hooks";
import { getPublicClient, getOAuthRedirectUrl, SupabaseCreds } from "../supabase/publicClient.ts";
import { Button } from "../components/Button.tsx";

type SupabaseButtonProps = {
  supabaseCreds: SupabaseCreds;
}
const SupabaseButton: preact.FunctionComponent<SupabaseButtonProps> = ({ supabaseCreds }) => {
  const publicSupabaseClient = getPublicClient(supabaseCreds);

  const signIn = useCallback(async () => {
    await publicSupabaseClient.auth.signInWithOAuth({
      provider: "twitch",
      options: {
        redirectTo: getOAuthRedirectUrl()
      }
    });
  }, []);

  return (
    <div class="p-2 bg-gray-300 flex items-center flex-col rounded-lg">
      <div class="p-3">
        You have to be authenticated to use this functionality
      </div>
      <Button class="flex items-center p-3" onClick={signIn}>
        <span class="flex items-center" >
          <img src="/assets/twitch.svg" class="h-8 mr-5" />
          Log in using Twitch
        </span>
      </Button>
    </div>
  );
};

export default SupabaseButton;
