import { crypto, toHashString } from "crypto/mod.ts";
const functionsDir = "./supabase/functions";
const decoder = new TextDecoder("utf-8");

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
  const res = await fetch(`https://api.supabase.com/v1/projects/${supabaseProjectRef}/functions/${slug}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${supabaseAccessToken}`,
      accept: "application/json",
      // "Content-Type": "application/json"
    }
  })
  console.log(`Deleting edge-function ${slug}`);
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
  console.log(`Creating edge-function ${name}`);
  return await res.json();
}

const updateFunction = async ({
  currentSlug,
  newSlug,
  name,
  body,
  verify_jwt,
  supabaseAccessToken,
  supabaseProjectRef
}: SupabaseCreds & { name: string; currentSlug: string; newSlug: string; body: string; verify_jwt: boolean; }) => {
  const res = await fetch(`https://api.supabase.com/v1/projects/${supabaseProjectRef}/functions/${currentSlug}`, {
    method: "PATCH",
    body: JSON.stringify({
      slug: newSlug,
      name,
      body,
      verify_jwt
    }),
    headers: {
      Authorization: `Bearer ${supabaseAccessToken}`,
      accept: "application/json",
      "Content-Type": "application/json"
    }
  });
  console.log(`Updating edge-function ${name}`);
  const resBody = await res.json();
  console.log(resBody);

  const res2 = await fetch(`https://api.supabase.com/v1/projects/${supabaseProjectRef}/functions/${newSlug}/body`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${supabaseAccessToken}`,
      accept: "application/json",
      "Content-Type": "application/json"
    }
  });
  const res2Body = await res2.text();
  console.log(res2Body);


  return resBody;
}

function toLocalFunction (name: string) {
  const path = `${functionsDir}/${name}/index.ts`;
  const fileContent = Deno.readFileSync(path);
  const body = decoder.decode(fileContent);
  const slug = toHashString(crypto.subtle.digestSync("SHA-512", fileContent), "hex");
  const verify_jwt = false;

  return {
    name,
    path,
    slug,
    body,
    verify_jwt
  };
}

export async function updateEdgeFunctions(creds: SupabaseCreds) {
  const localFunctions = [...Deno.readDirSync(functionsDir)]
    .filter(entry => entry.isDirectory)
    .map(entry => entry.name)
    .map(toLocalFunction);
  const localFunctionNames = localFunctions.map(func => func.name);

  const deployedFunctions = await getDeployedFunctionsList(creds);
  const deployedFunctionsNames = deployedFunctions.map(func => func.name);

  const deployedFunctionsToDelete = deployedFunctions
    .filter(func => !localFunctionNames.includes(func.name));
  
  const localFunctionsToCreate = localFunctions
    .filter(func => !deployedFunctionsNames.includes(func.name));

  const pairsToUpdate = deployedFunctions
    .filter(func => localFunctionNames.includes(func.name))
    .map(deployedFunction => {
      const localFunction = localFunctions
        .find(localFunc => localFunc.name === deployedFunction.name)!;
      return {
        deployedFunction,
        localFunction
      };
    })
    .filter(pair =>
      (pair.deployedFunction.slug !== pair.localFunction.slug) ||
      (pair.deployedFunction.verify_jwt !== pair.localFunction.verify_jwt)
    );

  await Promise.all(
    [
      ...deployedFunctionsToDelete.map(func => deleteFunction({
        slug: func.slug,
        ...creds
      })),
      ...localFunctionsToCreate.map(func => createFunction({
        body: func.body,
        name: func.name,
        slug: func.slug,
        verify_jwt: func.verify_jwt,
        ...creds
      })),
      ...pairsToUpdate.map(pair => updateFunction({
        currentSlug: pair.deployedFunction.slug,
        newSlug: pair.localFunction.slug,
        name: pair.deployedFunction.name,
        body: pair.localFunction.body,
        verify_jwt: pair.localFunction.verify_jwt,
        ...creds,
      }))
    ]
  );
}