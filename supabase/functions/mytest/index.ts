import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

export const handle = () => ({ Hi: "hello" });

serve(() => new Response(JSON.stringify(handle())));
