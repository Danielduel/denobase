import { config } from "https://deno.land/std@0.163.0/dotenv/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.1.1";

const tableName = "manjarnoLastMessage";
const contentColumnName = "rawContent";
const environmentColumnName = "environment";

const pingMe = `<@221718279423655937>`;
const pingRole = `<@&1028019874204745769>`;

type Row = {
  id: number;
  created_at: number;
  [environmentColumnName]: string | null;
  [contentColumnName]: string | null;
}

let envVars = {
  DISCORD_WEBHOOK_CONSOLE: "",
  DISCORD_WEBHOOK_MANJARNO: "",
  SUPABASE_URL: "",
  SUPABASE_API_ADMIN: "",
};
try {
  envVars = (await config()) as typeof envVars;
} catch (_) { _; }

const ENVIRONMENT = Deno.env.get("ENVIRONMENT_MANJARNO") ?? "dev";
const DISCORD_WEBHOOK_CONSOLE = Deno.env.get("DISCORD_WEBHOOK_CONSOLE") ?? envVars.DISCORD_WEBHOOK_CONSOLE;
const DISCORD_WEBHOOK_MANJARNO = Deno.env.get("DISCORD_WEBHOOK_MANJARNO") ?? envVars.DISCORD_WEBHOOK_MANJARNO;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? envVars.SUPABASE_URL;
const SUPABASE_API_ADMIN = Deno.env.get('SUPABASE_API_ADMIN') ?? envVars.SUPABASE_API_ADMIN;

const send = async (content: string, isConsole = true) => {
  const endpoint = isConsole ? DISCORD_WEBHOOK_CONSOLE : DISCORD_WEBHOOK_MANJARNO;
  if (!endpoint) {
    console.log("Endpoint invalid");
  }
  await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      content,
      username: "Manjarnoooo",
    })
  })
  .then()
  .catch(console.error);
}

export const extractContent = async (rawContent: string) => {
  try {
    const dateLine = [...rawContent.matchAll(/date: (.*),/gm)][0][1];
    const dateValue = [...dateLine.match(/[0-9]+/gm)!][0];
    const reasonValue = [...rawContent.matchAll(/reason: '(.*)'/gm)][0][1];
    return {
      parsable: true,
      extracted: {
        dateValue,
        reasonValue,
      },
    };
  } catch (err) {
    await send(`Something went wrong with manjarno function - extraction ${JSON.stringify(err)}`);
    return {
      parsable: false,
      extracted: { dateValue: null, reasonValue: null }
    };
  }
};

const getSupabaseClient = () => createClient(SUPABASE_URL, SUPABASE_API_ADMIN);

const getCachedEntryAsString = async () => {
  try {
    const supabaseClient = getSupabaseClient();
    const { data: focusedRow, error: focusedRowError } = await supabaseClient
      .from(tableName)
      .select("*")
      .eq(environmentColumnName, ENVIRONMENT)
      .maybeSingle();

    if (focusedRowError) {
      throw `focusedRowError: ${focusedRowError}`;
    }

    if (!focusedRow) {
      await supabaseClient.from(tableName).upsert({
        [contentColumnName]: "",
        [environmentColumnName]: ENVIRONMENT
      });
      return "";
    }

    return focusedRow[contentColumnName] as string;
  } catch (error) {
    await send(`${pingMe} We've a problem in Manjarno function chief`, true);
    await send(JSON.stringify(error), true);
  }
}

const updateCachedEntry = async (newContent: string) => {
  try {
    const supabaseClient = getSupabaseClient();
    const { error: updateError, count: updateCount } = await supabaseClient
      .from(tableName)
      .update({
        [contentColumnName]: newContent
      }, {
        count: "exact"
      })
      .eq(environmentColumnName, ENVIRONMENT);

    if (updateCount !== 1) {
      await send(`${pingMe} We've a problem in Manjarno function chief (UPDATE nonone (${updateCount}))`, true);
      await send(JSON.stringify(updateError), true);
      return false;
    }
    if (updateError) {
      await send(`${pingMe} We've a problem in Manjarno function chief (UPDATE error nonempty)`, true);
      await send(JSON.stringify(updateError), true);
      return false;
    }

    return true;
  } catch (error) {
    await send(`${pingMe} We've a problem in Manjarno function chief (UPDATE)`, true);
    await send(JSON.stringify(error), true);
    return false;
  }
}

const getNewEntryAsString = async () => await (await fetch("https://raw.githubusercontent.com/EmeraldSnorlax/manjarno/main/src/routes/event.ts")).text();
const handle = async () => {
  const cachedEntry = await getCachedEntryAsString();
  const newEntry = await getNewEntryAsString();
  if (cachedEntry === newEntry) {
    console.log("Nothing new Pausechamp");
    return;
  }

  const extracted = await extractContent(newEntry);
  if (!extracted.parsable) {
    await send(`${pingMe} New content is not parsable! ${newEntry}`, true);
    return;
  }
  if (!extracted.extracted.reasonValue || !extracted.extracted.reasonValue) {
    await send(`${pingMe} New content didn't match well! ${JSON.stringify(extracted)}`);
    return;
  }

  const { reasonValue, dateValue } = extracted.extracted;

  const updateSuccessful = updateCachedEntry(newEntry);
  if (!updateSuccessful) {
    // let's prevent spam loop
    await send(`${pingMe} Update fail! ${JSON.stringify(extracted)}`);
    return;
  }

  await send(`${pingRole} Manjaro did it again! They ${reasonValue}`, false);
  await send(`(new entry, ${dateValue}) Manjaro did it again! They ${reasonValue}`, true);
}

serve(async () => {
  await handle();

  return new Response("Done, thanks upstash");
});
