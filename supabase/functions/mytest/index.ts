import { serve } from "https://deno.land/std@0.131.0/http/server.ts";

console.log("Hello from Functions!");

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey',
}

serve(async (req) => {
  const { name } = await req.json();
  const data = {
    message: `Hello ${name}!`,
  };

  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
});
