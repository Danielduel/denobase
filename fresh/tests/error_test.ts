import { ServerContext, Status } from "../server.ts";
import { REFRESH_JS_URL } from "../src/server/constants.ts";
import { assert, assertEquals, assertStringIncludes } from "./deps.ts";
import manifest from "./fixture_error/fresh.gen.ts";

const ctx = await ServerContext.fromManifest(manifest, {});
const handler = ctx.handler();
const router = (req: Request) => {
  return handler(req, {
    localAddr: {
      transport: "tcp",
      hostname: "127.0.0.1",
      port: 80,
    },
    remoteAddr: {
      transport: "tcp",
      hostname: "127.0.0.1",
      port: 80,
    },
  });
};

Deno.test("error page rendered", async () => {
  const resp = await router(new Request("https://fresh.deno.dev/"));
  assert(resp);
  assertEquals(resp.status, Status.InternalServerError);
  assertEquals(resp.headers.get("content-type"), "text/html; charset=utf-8");
  const body = await resp.text();
  assertStringIncludes(
    body,
    `An error occurred during route handling or page rendering.`,
  );
  assertStringIncludes(body, `Error: boom!`);
  assertStringIncludes(body, `at render`);
});
Deno.test("refresh.js rendered", async () => {
  const resp = await router(
    new Request("https://fresh.deno.dev" + REFRESH_JS_URL),
  );
  assert(resp);
  assertEquals(resp.status, Status.OK);
  assertEquals(
    resp.headers.get("content-type"),
    "application/javascript; charset=utf-8",
  );
});
