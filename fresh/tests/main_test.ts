import { ServerContext, Status } from "../server.ts";
import {
  assert,
  assertEquals,
  assertStringIncludes,
  delay,
  puppeteer,
  TextLineStream,
} from "./deps.ts";
import manifest from "./fixture/fresh.gen.ts";
import options from "./fixture/options.ts";

const ctx = await ServerContext.fromManifest(manifest, options);
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

Deno.test("/ page prerender", async () => {
  const resp = await router(new Request("https://fresh.deno.dev/"));
  assert(resp);
  assertEquals(resp.status, Status.OK);
  assertEquals(resp.headers.get("content-type"), "text/html; charset=utf-8");
  assertEquals(resp.headers.get("server"), "fresh test server");
  const body = await resp.text();
  assertStringIncludes(body, `<html lang="en">`);
  assertStringIncludes(body, "test.js");
  assertStringIncludes(body, "<p>Hello!</p>");
  assertStringIncludes(body, "<p>Viewing JIT render.</p>");
  assertStringIncludes(body, `>[[{"message":"Hello!"}],[]]</script>`);
  assertStringIncludes(
    body,
    `<meta name="description" content="Hello world!" />`,
  );
});

Deno.test("/props/123 page prerender", async () => {
  const resp = await router(new Request("https://fresh.deno.dev/props/123"));
  assert(resp);
  assertEquals(resp.status, Status.OK);
  assertEquals(resp.headers.get("content-type"), "text/html; charset=utf-8");
  const body = await resp.text();
  assertStringIncludes(
    body,
    `{&quot;params&quot;:{&quot;id&quot;:&quot;123&quot;},&quot;url&quot;:&quot;https://fresh.deno.dev/props/123&quot;,&quot;route&quot;:&quot;/props/:id&quot;}`,
  );
});

Deno.test("/[name] page prerender", async () => {
  const resp = await router(new Request("https://fresh.deno.dev/bar"));
  assert(resp);
  assertEquals(resp.status, Status.OK);
  assertEquals(resp.headers.get("content-type"), "text/html; charset=utf-8");
  const body = await resp.text();
  assertStringIncludes(body, "<div>Hello bar</div>");
});

Deno.test("/intercept - GET html", async () => {
  const req = new Request("https://fresh.deno.dev/intercept", {
    headers: { "accept": "text/html" },
  });
  const resp = await router(req);
  assert(resp);
  assertEquals(resp.status, Status.OK);
  const body = await resp.text();
  assertStringIncludes(body, "<div>This is HTML</div>");
});

Deno.test("/intercept - GET text", async () => {
  const req = new Request("https://fresh.deno.dev/intercept", {
    headers: { "accept": "text/plain" },
  });
  const resp = await router(req);
  assert(resp);
  assertEquals(resp.status, Status.OK);
  const body = await resp.text();
  assertEquals(body, "This is plain text");
});

Deno.test("/intercept - POST", async () => {
  const req = new Request("https://fresh.deno.dev/intercept", {
    method: "POST",
  });
  const resp = await router(req);
  assert(resp);
  assertEquals(resp.status, Status.OK);
  const body = await resp.text();
  assertEquals(body, "POST response");
});

Deno.test("/intercept - DELETE", async () => {
  const req = new Request("https://fresh.deno.dev/intercept", {
    method: "DELETE",
  });
  const resp = await router(req);
  assert(resp);
  assertEquals(resp.status, Status.MethodNotAllowed);
});

Deno.test("/intercept_args - GET html", async () => {
  const req = new Request("https://fresh.deno.dev/intercept_args", {
    headers: { "accept": "text/html" },
  });
  const resp = await router(req);
  assert(resp);
  assertEquals(resp.status, Status.OK);
  const body = await resp.text();
  assertStringIncludes(body, "<div>intercepted</div>");
});

Deno.test("/api/get_only - NOTAMETHOD", async () => {
  const resp = await router(
    new Request("https://fresh.deno.dev/api/get_only", {
      method: "NOTAMETHOD",
    }),
  );
  assert(resp);
  assertEquals(resp.status, Status.MethodNotAllowed);
});

Deno.test("/api/xyz not found", async () => {
  const resp = await router(new Request("https://fresh.deno.dev/api/xyz"));
  assert(resp);
  assertEquals(resp.status, Status.NotFound);
  const body = await resp.text();
  assertStringIncludes(body, "404 not found: /api/xyz");
});

Deno.test("/static page prerender", async () => {
  const resp = await router(new Request("https://fresh.deno.dev/static"));
  assert(resp);
  assertEquals(resp.status, Status.OK);
  assertEquals(resp.headers.get("content-type"), "text/html; charset=utf-8");
  const body = await resp.text();
  assert(!body.includes(`main.js`));
  assert(!body.includes(`island-test.js`));
  assertStringIncludes(body, "<p>This is a static page.</p>");
  assertStringIncludes(body, `src="/image.png?__frsh_c=`);
  assert(!body.includes("__FRSH_ISLAND_PROPS"));
});

Deno.test("/books/:id page - /books/123", async () => {
  const resp = await router(new Request("https://fresh.deno.dev/books/123"));
  assert(resp);
  assertEquals(resp.status, Status.OK);
  assertEquals(resp.headers.get("content-type"), "text/html; charset=utf-8");
  const body = await resp.text();
  assertStringIncludes(body, "<div>Book 123</div>");
});

Deno.test("/books/:id page - /books/abc", async () => {
  const resp = await router(new Request("https://fresh.deno.dev/books/abc"));
  assert(resp);
  assertEquals(resp.status, Status.NotFound);
});

Deno.test("redirect /pages/fresh/ to /pages/fresh", async () => {
  const resp = await router(new Request("https://fresh.deno.dev/pages/fresh/"));
  assert(resp);
  assertEquals(resp.status, Status.TemporaryRedirect);
  assertEquals(
    resp.headers.get("location"),
    "https://fresh.deno.dev/pages/fresh",
  );
});

Deno.test("/failure", async () => {
  const resp = await router(new Request("https://fresh.deno.dev/failure"));
  assert(resp);
  assertEquals(resp.status, Status.InternalServerError);
  const body = await resp.text();
  assert(body.includes("500 internal error: it errored!"));
});

Deno.test("/foo/:path*", async () => {
  const resp = await router(new Request("https://fresh.deno.dev/foo/bar/baz"));
  assert(resp);
  assertEquals(resp.status, Status.OK);
  const body = await resp.text();
  assert(body.includes("bar/baz"));
});

Deno.test("static files in custom directory", async () => {
  const newCtx = await ServerContext.fromManifest(manifest, {
    ...options,
    staticDir: "./custom_static",
  });
  const newRouter = (req: Request) => {
    return newCtx.handler()(req, {
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

  const resp = await newRouter(
    new Request("https://fresh.deno.dev/custom.txt"),
  );
  assertEquals(resp.status, Status.OK);
  const body = await resp.text();
  assert(body.startsWith("dir"));
});

Deno.test("static file - by file path", async () => {
  const resp = await router(new Request("https://fresh.deno.dev/foo.txt"));
  assertEquals(resp.status, Status.OK);
  const body = await resp.text();
  assert(body.startsWith("bar"));
  const etag = resp.headers.get("etag");
  assert(etag);
  // The etag is not weak, because this did not go through content encoding, so
  // this is not a real server.
  assert(!etag.startsWith("W/"), "etag should be weak");
  assertEquals(resp.headers.get("content-type"), "text/plain");

  const resp2 = await router(
    new Request("https://fresh.deno.dev/foo.txt", {
      headers: {
        "if-none-match": etag,
      },
    }),
  );
  assertEquals(resp2.status, Status.NotModified);
  assertEquals(resp2.headers.get("etag"), etag);
  assertEquals(resp2.headers.get("content-type"), "text/plain");

  const resp3 = await router(
    new Request("https://fresh.deno.dev/foo.txt", {
      headers: {
        "if-none-match": `W/${etag}`,
      },
    }),
  );
  assertEquals(resp3.status, Status.NotModified);
  assertEquals(resp3.headers.get("etag"), etag);
  assertEquals(resp3.headers.get("content-type"), "text/plain");
});

Deno.test("static file - by 'hashed' path", async () => {
  // Check that the file path have the BUILD_ID
  const resp = await router(
    new Request("https://fresh.deno.dev/assetsCaching"),
  );
  const body = await resp.text();
  const imgFilePath = body.match(/img id="img-with-hashing" src="(.*?)"/)?.[1];
  assert(imgFilePath);
  assert(imgFilePath.includes(`?__frsh_c=${globalThis.__FRSH_BUILD_ID}`));

  // check the static file is served corectly under its cacheable route
  const resp2 = await router(
    new Request(`https://fresh.deno.dev${imgFilePath}`),
  );
  const _ = await resp2.text();
  assertEquals(resp2.status, Status.OK);
  assertEquals(
    resp2.headers.get("cache-control"),
    "public, max-age=31536000, immutable",
  );

  const resp3 = await router(
    new Request(`https://fresh.deno.dev${imgFilePath}`, {
      headers: {
        "if-none-match": resp2.headers.get("etag")!,
      },
    }),
  );
  assertEquals(resp3.status, Status.NotModified);

  // ensure asset hook is not applied on file explicitly excluded with attribute
  const imgFilePathWithNoCache = body.match(
    /img id="img-without-hashing" src="(.*?)"/,
  )?.[1];
  assert(imgFilePathWithNoCache);
  assert(
    !imgFilePathWithNoCache.includes(globalThis.__FRSH_BUILD_ID),
    "img-without-hashing",
  );

  // ensure asset hook is applied on img within an island
  const imgInIsland = body.match(/img id="img-in-island" src="(.*?)"/)?.[1];
  assert(imgInIsland);
  assert(imgInIsland.includes(globalThis.__FRSH_BUILD_ID), "img-in-island");

  // verify that the asset hook is applied to the srcset
  const imgInIslandSrcSet = body.match(/srcset="(.*?)"/)?.[1];
  assert(imgInIslandSrcSet);
  assert(
    imgInIslandSrcSet.includes(globalThis.__FRSH_BUILD_ID),
    "img-in-island-srcset",
  );

  // verify that the asset hook is not applied to img outside reference out of the static folder
  const imgMissing = body.match(/img id="img-missing" src="(.*?)"/)?.[1];
  assert(imgMissing);
  assert(
    !imgMissing.includes(globalThis.__FRSH_BUILD_ID),
    "Applying hash on unknown asset",
  );
});

Deno.test("/params/:path*", async () => {
  const resp = await router(
    new Request("https://fresh.deno.dev/params/bar/baz"),
  );
  assert(resp);
  assertEquals(resp.status, Status.OK);
  const body = await resp.text();
  assertEquals(body, "bar/baz");
});

Deno.test("/connInfo", async () => {
  const resp = await router(new Request("https://fresh.deno.dev/connInfo"));
  assert(resp);
  assertEquals(resp.status, Status.OK);
  const body = await resp.text();
  assertEquals(body, "127.0.0.1");
});

Deno.test({
  name: "/middleware - root",
  fn: async () => {
    const resp = await router(
      new Request("https://fresh.deno.dev/middleware_root"),
    );
    assert(resp);
    assertEquals(resp.status, Status.OK);
    const body = await resp.text();
    assertStringIncludes(body, "root_mw");
    assert(!body.includes("layer1_mw"));
  },
});

Deno.test({
  name: "/middleware - mixedHandler(cors)",
  fn: async () => {
    const resp = await router(
      new Request("https://fresh.deno.dev/middleware_root", {
        method: "OPTIONS",
      }),
    );
    assert(resp);

    // test cors handler
    assertEquals(resp.status, Status.NoContent);
  },
});

Deno.test({
  name: "/middleware - mixedHandler(log)",
  fn: async () => {
    const resp = await router(
      new Request("https://fresh.deno.dev/middleware_root"),
    );
    assert(resp);
    assertEquals(resp.status, Status.OK);

    // test log handler
    const latency = resp.headers.get("latency");
    assert(latency);
    assert(+latency >= 0, `latency=${latency}ms `);
  },
});

Deno.test({
  name: "/middleware - layer 2 middleware",
  fn: async () => {
    const resp = await router(
      new Request("https://fresh.deno.dev/layeredMdw/layer2/abc"),
    );
    assert(resp);
    assertEquals(resp.status, Status.OK);
    const body = await resp.text();
    console.log(body);
    assertStringIncludes(body, "root_mw");
    assertStringIncludes(body, "layer1_mw");
    assertStringIncludes(body, "layer2_mw");
    // layered 2 should not run layer 3 middleware
    assert(!body.includes("layer3_mw"));

    const resp1 = await router(
      new Request("https://fresh.deno.dev/layeredMdw/layer2-no-mw/without_mw"),
    );
    assert(resp1);
    assertEquals(resp1.status, Status.OK);
    const body1 = await resp1.text();
    assertStringIncludes(body1, "root_mw");
    assertStringIncludes(body1, "layer1_mw");
    // layered 2 should not run layer 2 or 3 middleware
    assert(!body1.includes("layer2_mw"));
    assert(!body1.includes("layer3_mw"));
  },
});

Deno.test({
  name: "/middleware - layer 2 middleware at index",
  fn: async () => {
    const resp = await router(
      new Request("https://fresh.deno.dev/layeredMdw/layer2"),
    );
    assert(resp);
    assertEquals(resp.status, Status.OK);
    const body = await resp.text();
    console.log(body);
    assertStringIncludes(body, "root_mw");
    assertStringIncludes(body, "layer1_mw");
    assertStringIncludes(body, "layer2_mw");
    // layered 2 should not run layer 3 middleware
    assert(!body.includes("layer3_mw"));

    const resp1 = await router(
      new Request("https://fresh.deno.dev/layeredMdw/layer2-no-mw/without_mw"),
    );
    assert(resp1);
    assertEquals(resp1.status, Status.OK);
    const body1 = await resp1.text();
    assertStringIncludes(body1, "root_mw");
    assertStringIncludes(body1, "layer1_mw");
    // layered 2 should not run layer 2 or 3 middleware
    assert(!body1.includes("layer2_mw"));
    assert(!body1.includes("layer3_mw"));
  },
});

Deno.test({
  name: "/middleware - layer 3 middleware",
  fn: async () => {
    // layered 3 should contain layer 3 middleware data
    const resp = await router(
      new Request("https://fresh.deno.dev/layeredMdw/layer2/layer3/abc"),
    );
    assert(resp);
    assertEquals(resp.status, Status.OK);
    const body = await resp.text();
    assertStringIncludes(body, "root_mw");
    assertStringIncludes(body, "layer1_mw");
    assertStringIncludes(body, "layer3_mw");
    assertEquals(resp.headers.get("layer3"), "fresh test server layer3");
    // the below ensure that the middlewware are applied in the correct order.
    // i.e response header set from layer3 middleware is overwritten
    // by the reponse header in layer 0
    assertEquals(resp.headers.get("server"), "fresh test server");
  },
});

Deno.test({
  name: "/not_found",
  fn: async () => {
    const resp = await router(new Request("https://fresh.deno.dev/not_found"));
    assert(resp);
    assertEquals(resp.status, 404);
    const body = await resp.text();
    assertStringIncludes(body, "404 not found: /not_found");
  },
});

Deno.test("experimental Deno.serve", {
  sanitizeOps: false,
  sanitizeResources: false,
  ignore: Deno.build.os === "windows", // TODO: Deno.serve hang on Windows?
}, async (t) => {
  // Preparation
  const serverProcess = Deno.run({
    cmd: [
      "deno",
      "run",
      "-A",
      "--unstable",
      "./tests/fixture/main.ts",
      "--experimental-deno-serve",
    ],
    stdout: "piped",
    stderr: "inherit",
  });

  const decoder = new TextDecoderStream();
  const lines = serverProcess.stdout.readable
    .pipeThrough(decoder)
    .pipeThrough(new TextLineStream());

  let started = false;
  for await (const line of lines) {
    if (line.includes("Listening on http://")) {
      started = true;
      break;
    }
  }
  if (!started) {
    throw new Error("Server didn't start up");
  }

  await delay(100);

  await t.step("ssr", async () => {
    const resp = await fetch("http://localhost:8000");
    assert(resp);
    assertEquals(resp.status, Status.OK);
    assertEquals(resp.headers.get("content-type"), "text/html; charset=utf-8");
    assertEquals(resp.headers.get("server"), "fresh test server");
    const body = await resp.text();
    assertStringIncludes(body, `<html lang="en">`);
    assertStringIncludes(body, "test.js");
    assertStringIncludes(body, "<p>Hello!</p>");
    assertStringIncludes(body, "<p>Viewing JIT render.</p>");
    assertStringIncludes(body, `>[[{"message":"Hello!"}],[]]</script>`);
    assertStringIncludes(
      body,
      `<meta name="description" content="Hello world!" />`,
    );
  });

  await t.step("static file", async () => {
    const resp = await fetch("http://localhost:8000/foo.txt");
    assertEquals(resp.status, Status.OK);
    const body = await resp.text();
    assert(body.startsWith("bar"));
    const etag = resp.headers.get("etag");
    assert(etag);
    assert(!etag.startsWith("W/"), "etag should be weak");
    assertEquals(resp.headers.get("content-type"), "text/plain");
  });

  await lines.cancel();
  serverProcess.kill("SIGTERM");
  serverProcess.close();
});

Deno.test("jsx pragma works", {
  sanitizeOps: false,
  sanitizeResources: false,
}, async (t) => {
  // Preparation
  const serverProcess = Deno.run({
    cmd: ["deno", "run", "-A", "./tests/fixture_jsx_pragma/main.ts"],
    stdout: "piped",
    stderr: "inherit",
  });

  const decoder = new TextDecoderStream();
  const lines = serverProcess.stdout.readable
    .pipeThrough(decoder)
    .pipeThrough(new TextLineStream());

  let started = false;
  for await (const line of lines) {
    if (line.includes("Listening on http://")) {
      started = true;
      break;
    }
  }
  if (!started) {
    throw new Error("Server didn't start up");
  }

  await delay(100);

  await t.step("ssr", async () => {
    const resp = await fetch("http://localhost:8000");
    assertEquals(resp.status, Status.OK);
    const text = await resp.text();
    assertStringIncludes(text, "Hello World");
    assertStringIncludes(text, "ssr");
  });

  const browser = await puppeteer.launch({ args: ["--no-sandbox"] });
  const page = await browser.newPage();

  await page.goto("http://localhost:8000", {
    waitUntil: "networkidle2",
  });

  await t.step("island is revived", async () => {
    await page.waitForSelector("#csr");
  });

  await browser.close();

  await lines.cancel();
  serverProcess.kill("SIGTERM");
  serverProcess.close();
});
