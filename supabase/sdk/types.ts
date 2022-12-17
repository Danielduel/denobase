import { Flavor } from "ts-branding";
import { UnionDeployedFunctionName } from "../generated/UnionDeployedFunctionName.generated.ts";

export type SupabaseAPICreds = {
  supabaseAccessToken: string;
  supabaseProjectRef: string;
};

export type SupabasePublicClientCreds = {
  supabaseProjectUrl: string;
  supabasePublicKey: string;
}

export type DeployedFunctionName = UnionDeployedFunctionName;
export type DeployedFunctionSlug = Flavor<string, "DeployedFunctionSlug">;
export type EdgeFunctionNameToSlugMapping = Record<DeployedFunctionName, DeployedFunctionSlug>;
