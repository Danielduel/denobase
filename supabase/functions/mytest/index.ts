import { config } from "https://deno.land/std@0.163.0/dotenv/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const envVars = await config();
const consoleWebhook = Deno.env.get("DISCORD_WEBHOOK_CONSOLE") ?? envVars.DISCORD_WEBHOOK_CONSOLE;
const manjarnoWebhook = Deno.env.get("DISCORD_WEBHOOK_MANJARNO") ?? envVars.DISCORD_WEBHOOK_MANJARNO;

const send = async (content: string, isConsole = true) => {
  const endpoint = isConsole ? consoleWebhook : manjarnoWebhook;
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

export const handle = (rawContent: string) => {
  try {
    const dateLine = [...rawContent.matchAll(/date: (.*),/gm)][0][1];
    const dateValue = [...dateLine.match(/[0-9]+/gm)!][0];
    const reasonValue = [...rawContent.matchAll(/reason: '(.*)'/gm)][0][1];
    send(`Manjaro did it again! They ${reasonValue}`, false);
    return { dateValue, reasonValue };
  } catch (_) {
    console.log("triggering")
    send("Something went wrong with manjarno function");
  }
};

serve(async () => {
  const rawContent = await (await fetch("https://raw.githubusercontent.com/EmeraldSnorlax/manjarno/main/src/routes/event.ts")).text();

  // Example response text:
  // // What have they messed up now?

  // export default {
  //   date: new Date(1667606399000),
  //   reason: 'forgot to renew their archived forums\' SSL cert.'
  // }

  return new Response(
    JSON.stringify(
      handle(rawContent)
    )
  );
});
