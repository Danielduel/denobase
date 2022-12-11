import { appRouter } from "./router.ts";
import type { render } from "../fresh/src/server/render.ts";
import type { TrpcCallerContext } from "./TrpcCallerContext.d.ts";
type Opts<D> = Parameters<typeof render<D>>[0];

export const serverSideTrpc = (ctx?: TrpcCallerContext) => ctx && appRouter.createCaller(ctx);
export const getTrpcCallerContext = <D>(opts: Opts<D>): TrpcCallerContext => {
  return {
    req: opts.req
  }
}