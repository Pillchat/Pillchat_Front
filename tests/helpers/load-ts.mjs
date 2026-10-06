import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";
const require = createRequire(import.meta.url);
export function loader(globals = {}, overrides = {}) {
  const cache = new Map();
  function load(file) {
    const absolute = path.resolve(file);
    if (cache.has(absolute)) return cache.get(absolute);
    const exports = {};
    cache.set(absolute, exports);
    const source = readFileSync(absolute, "utf8");
    const { outputText } = ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        esModuleInterop: true,
      },
    });
    vm.runInNewContext(
      outputText,
      {
        exports,
        console,
        process,
        URL,
        URLSearchParams,
        Request,
        Response,
        Headers,
        FormData,
        Blob,
        atob,
        crypto: globalThis.crypto,
        Event,
        setTimeout,
        clearTimeout,
        require(name) {
          if (name in overrides) return overrides[name];
          if (name.startsWith("@/")) return load(`${name.slice(2)}.ts`);
          if (name.startsWith("."))
            return load(path.resolve(path.dirname(absolute), `${name}.ts`));
          return require(name);
        },
        ...globals,
      },
      { filename: absolute },
    );
    return exports;
  }
  return load;
}
export function storage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
}
export const jwt = (userId = "1", expiresIn = 3600) =>
  `e30.${Buffer.from(JSON.stringify({ sub: userId, exp: Math.floor(Date.now() / 1000) + expiresIn })).toString("base64url")}.signature`;
