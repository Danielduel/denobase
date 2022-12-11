import { createTRPCClient } from "@trpc/client";
import type { AppRouter } from "./router.ts";

export const trpc = createTRPCClient<AppRouter>({
  url: "/api/trpc",
});

export const clientSideTrpc = (...ignoreArgs: any[]) => trpc
