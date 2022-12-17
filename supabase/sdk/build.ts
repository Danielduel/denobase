/**
 * This comes from supabuild's CLI repo, it is licensed as follows:
 */
//  MIT License

//  Copyright (c) 2021 Bobbie Soedirgo
 
//  Permission is hereby granted, free of charge, to any person obtaining a copy
//  of this software and associated documentation files (the "Software"), to deal
//  in the Software without restriction, including without limitation the rights
//  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
//  copies of the Software, and to permit persons to whom the Software is
//  furnished to do so, subject to the following conditions:
 
//  The above copyright notice and this permission notice shall be included in all
//  copies or substantial portions of the Software.
 
//  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
//  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
//  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
//  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
//  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
//  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
//  SOFTWARE.
 

import * as path from "https://deno.land/std@0.127.0/path/mod.ts";
import { compress } from "https://deno.land/x/brotli@0.1.7/mod.ts";

import { build } from "https://deno.land/x/eszip@v0.30.0/mod.ts";
import { load } from "https://deno.land/x/eszip@v0.30.0/loader.ts";

const virtualBasePath = "file:///src/";

export async function buildAndWrite(p: string) {
  const funcDirPath = path.dirname(p);
  const entrypoint = new URL("index.ts", virtualBasePath).href;

  const eszip = await build([entrypoint], async (specifier: string) => {
    const url = new URL(specifier);
    if (url.protocol === 'file:') {
      console.error(specifier)
      // if the path is `file:///*`, treat it as a path from parent directory
      let actualPath = specifier.replace('file:///', `./${funcDirPath}/../`);
      // if the path is `file:///src/*`, treat it as a relative path from current dir
      if (specifier.startsWith(virtualBasePath)) {
        actualPath = specifier.replace(virtualBasePath, `./${funcDirPath}/`);
      }
      try {
        const content = await Deno.readTextFile(actualPath);
        return {
          kind: "module",
          specifier,
          content
        }
      } catch (e) {
        if((e instanceof Deno.errors.NotFound) && actualPath.endsWith('import_map.json')) {
          // if there's no import_map.json, set an empty one
          return {
            kind: "module",
            specifier,
            content: `{ "imports": {} }`
          }
        } else {
          throw e;
        }
      }
    } 

    return load(specifier);
  }, "file:///src/import_map.json");
  // compress ESZIP payload using Brotli
  const compressed = compress(eszip);

  // add a marker frame to the start of the payload
  const marker = new TextEncoder().encode("EZBR");

  const combinedPayload = new Uint8Array(marker.length + compressed.length);
  combinedPayload.set(marker);
  combinedPayload.set(compressed, marker.length);

  return combinedPayload;
}

// buildAndWrite(Deno.args[0]);
