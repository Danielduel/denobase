import { IS_BROWSER } from "../fresh/runtime.ts";
import type { TrpcCallerContext } from "./TrpcCallerContext.d.ts";
import type { trpc as _trpc } from "./clientSideTrpc.ts";


type TrpcExport = <T extends TrpcCallerContext | null>(ctx: T) => (
  (typeof ctx) extends null
  ? (typeof _trpc | undefined)
  : (typeof _trpc)
);

// I am not 100% sure if it will treeshake only the needed part
const __trpc = IS_BROWSER
  ? await import("./clientSideTrpc.ts").then(m => m.clientSideTrpc)
  : await import("./serverSideTrpc.ts").then(m => m.serverSideTrpc);

export const trpc = __trpc as TrpcExport;

// Client and server:
// trpc({ req: {} as Request}).query("joke")
// "null" marks call as client-side only, I have to think about better solution
// trpc(null)?.query("joke")
