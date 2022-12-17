import { crypto, toHashString } from "crypto/mod.ts";
import { buildAndWrite } from "./build.ts";
import * as _path from "std/path/mod.ts";
import { DeployedFunctionName, DeployedFunctionSlug, EdgeFunctionNameToSlugMapping, SupabaseAPICreds } from "./types.ts";
const functionsDir = "./supabase/functions";
const decoder = new TextDecoder("utf-8");
const generatedPaths = {
  UnionDeployedFunctionName: "./supabase/generated/UnionDeployedFunctionName.generated.ts"
};

type DeployedFunction = {
  verify_jwt: boolean;
  id: string;
  slug: DeployedFunctionSlug;
  name: DeployedFunctionName;
  version: number;
  status: "ACTIVE" | "";
  created_at: number;
  updated_at: number;
};


const getDeployedFunctionsList = async ({
  supabaseAccessToken,
  supabaseProjectRef,
}: SupabaseAPICreds) => {
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${supabaseProjectRef}/functions`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${supabaseAccessToken}`,
      },
    },
  );
  return (await res.json()) as DeployedFunction[];
};

const deleteFunction = async ({
  slug,
  supabaseAccessToken,
  supabaseProjectRef,
}: SupabaseAPICreds & { slug: string }) => {
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${supabaseProjectRef}/functions/${slug}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${supabaseAccessToken}`,
        accept: "application/json",
        // "Content-Type": "application/json"
      },
    },
  );
  console.log(`Deleting edge-function ${slug}`);
  return res.statusText;
};

const createFunction = async ({
  slug,
  name,
  path,
  body,
  verify_jwt,
  supabaseAccessToken,
  supabaseProjectRef,
}: SupabaseAPICreds & {
  name: string;
  slug: string;
  path: string;
  body: string;
  verify_jwt: boolean;
}) => {
  const buildBuffer = await buildAndWrite(path);

  await fetch(
    `https://api.supabase.com/v1/projects/${supabaseProjectRef}/functions`,
    {
      method: "POST",
      body: JSON.stringify({
        slug,
        name,
        body: "",
        verify_jwt,
      }),
      headers: {
        Authorization: `Bearer ${supabaseAccessToken}`,
        "Content-Type": "application/json", // 
      },
    },
  );
  const res = await fetch(`https://api.supabase.com/v1/projects/${supabaseProjectRef}/functions/${slug}`, {
    method: "PATCH",
    body: buildBuffer,
    headers: {
      Authorization: `Bearer ${supabaseAccessToken}`,
      "Content-Type": "application/vnd.denoland.eszip"
    }
  });
  console.log(`Creating edge-function ${name}`);
  const resJson = await res.json();
  return resJson;
};

const updateFunction = async ({
  currentSlug,
  newSlug,
  name,
  path,
  body,
  verify_jwt,
  supabaseAccessToken,
  supabaseProjectRef,
}: SupabaseAPICreds & {
  name: string;
  path: string;
  currentSlug: string;
  newSlug: string;
  body: string;
  verify_jwt: boolean;
}) => {
  // It can't be changed using update itself, because it doesn't support changing slug
  // const res = await fetch(`https://api.supabase.com/v1/projects/${supabaseProjectRef}/functions/${currentSlug}`, {
  //   method: "PATCH",
  //   body: JSON.stringify({
  //     slug: newSlug,
  //     name,
  //     body,
  //     verify_jwt
  //   }),
  //   headers: {
  //     Authorization: `Bearer ${supabaseAccessToken}`,
  //     accept: "application/json",
  //     "Content-Type": "application/json"
  //   }
  // });
  console.log(`Updating edge-function ${name}`);
  await deleteFunction({
    slug: currentSlug,
    supabaseAccessToken,
    supabaseProjectRef,
  });

  const createRes = await createFunction({
    slug: newSlug,
    body,
    path,
    name,
    verify_jwt,
    supabaseAccessToken,
    supabaseProjectRef,
  });

  return createRes;
};

export async function getDeployedFunctionBody({
  slug,
  supabaseProjectRef,
  supabaseAccessToken,
}: SupabaseAPICreds & { slug: string }) {
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${supabaseProjectRef}/functions/${slug}/body`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${supabaseAccessToken}`,
        accept: "application/json",
        "Content-Type": "application/json",
      },
    },
  );
  const resBody = await res.text();
  return resBody;
}

export async function invokeFunctionBySlug({
  slug,
  supabaseProjectRef,
  supabasePublicKey,
}: Pick<SupabaseAPICreds, "supabaseProjectRef"> & {
  supabasePublicKey: string;
  slug: string;
}) {
  const res = await fetch(
    `https://${supabaseProjectRef}.functions.supabase.co/${slug}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${supabasePublicKey}`,
        "Content-Type": "application/json",
      },
    },
  );
  const resBody = await res.text();
  return resBody;
}

export async function invokeFunctionByName({
  functionName,
  edgeFunctionNameToSlugMapping,
  supabaseProjectRef,
  supabasePublicKey,
}: Pick<SupabaseAPICreds, "supabaseProjectRef"> & {
  functionName: DeployedFunctionName;
  supabasePublicKey: string;
  edgeFunctionNameToSlugMapping: EdgeFunctionNameToSlugMapping;
}) {
  const slug = edgeFunctionNameToSlugMapping[functionName];
  const res = await fetch(
    `https://${supabaseProjectRef}.functions.supabase.co/${slug}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${supabasePublicKey}`,
        "Content-Type": "application/json",
      },
    },
  );
  const resBody = await res.text();
  return resBody;
}

function toLocalFunction(name: string) {
  const path = `${functionsDir}/${name}/index.ts`;
  const fileContent = Deno.readFileSync(path);
  const body = decoder.decode(fileContent);
  const slug = toHashString(
    crypto.subtle.digestSync("SHA-256", fileContent),
    "hex",
  );
  const verify_jwt = false;

  return {
    name,
    path,
    slug,
    body,
    verify_jwt,
  };
}

async function createEdgeFunctionNameToSlugMapping(creds: SupabaseAPICreds) {
  const currentDeploymentStatus = await getDeployedFunctionsList(creds);

  const edgeFunctionNameToSlugMapping = currentDeploymentStatus
    .reduce((result, func) => {
      return { ...result, [func.name]: func.slug };
    }, {} as EdgeFunctionNameToSlugMapping);

  const typegenUnion = Object.keys(edgeFunctionNameToSlugMapping)
    .map(key => `| "${key}"`)
    .join("\n  ")
  const typegenContent = `export type UnionDeployedFunctionName = \n  ${typegenUnion};\n`;
  const prevTypegenContent = Deno.readTextFileSync(generatedPaths.UnionDeployedFunctionName);
  const shouldUpdate = prevTypegenContent !== typegenContent;
  if (shouldUpdate) {
    Deno.writeTextFileSync(generatedPaths.UnionDeployedFunctionName, typegenContent);
  }

  return edgeFunctionNameToSlugMapping;
}

// function downloadAllDeployedFunctions() {
//   (await Promise.all(
//     updatedDeployedFunctions
//       .map((func) =>
//         getDeployedFunctionBody({
//           slug: func.slug,
//           ...creds
//         })
//       ),
//   )).map(content => Deno.writeTextFileSync("debug.ts", content))
// }

export async function updateEdgeFunctions(creds: SupabaseAPICreds) {
  const localFunctions = [...Deno.readDirSync(functionsDir)]
    .filter((entry) => entry.isDirectory)
    .map((entry) => entry.name)
    .map(toLocalFunction);
  const localFunctionNames = localFunctions.map((func) => func.name);

  const deployedFunctions = await getDeployedFunctionsList(creds);
  const deployedFunctionsNames = deployedFunctions.map((func) => func.name);

  const deployedFunctionsToDelete = deployedFunctions
    .filter((func) => !localFunctionNames.includes(func.name));

  const localFunctionsToCreate = localFunctions
    .filter((func) => !deployedFunctionsNames.includes(func.name as DeployedFunctionName));

  const pairsToUpdate = deployedFunctions
    .filter((func) => localFunctionNames.includes(func.name))
    .map((deployedFunction) => {
      const localFunction = localFunctions
        .find((localFunc) => localFunc.name === deployedFunction.name)!;
      return {
        deployedFunction,
        localFunction,
      };
    })
    .filter((pair) =>
      (pair.deployedFunction.slug !== pair.localFunction.slug) ||
      (pair.deployedFunction.verify_jwt !== pair.localFunction.verify_jwt)
    );

  await Promise.all(
    [
      ...deployedFunctionsToDelete.map((func) =>
        deleteFunction({
          slug: func.slug,
          ...creds,
        })
      ),
      ...localFunctionsToCreate.map((func) =>
        createFunction({
          body: func.body,
          name: func.name,
          path: func.path,
          slug: func.slug,
          verify_jwt: func.verify_jwt,
          ...creds,
        })
      ),
      ...pairsToUpdate.map((pair) =>
        updateFunction({
          currentSlug: pair.deployedFunction.slug,
          newSlug: pair.localFunction.slug,
          name: pair.deployedFunction.name,
          path: pair.localFunction.path,
          body: pair.localFunction.body,
          verify_jwt: pair.localFunction.verify_jwt,
          ...creds,
        })
      ),
    ],
  );

  const edgeFunctionNameToSlugMapping = await createEdgeFunctionNameToSlugMapping(creds);

  return {
    edgeFunctionNameToSlugMapping
  };
}
