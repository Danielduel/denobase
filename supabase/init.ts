import { SupabaseAPICreds } from "./sdk/types.ts";
import { updateEdgeFunctions } from "./sdk/updateEdgeFunctions.ts";

export async function supabaseInit (creds: SupabaseAPICreds) {
  const { edgeFunctionNameToSlugMapping } = await updateEdgeFunctions(creds);

  return {
    edgeFunctionNameToSlugMapping,
  };
}
