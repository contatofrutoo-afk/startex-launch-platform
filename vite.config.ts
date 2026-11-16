// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// Never set ssr.external or resolve.external: the Worker has no runtime module resolution, so
// the build fails. Never add compression (compressPublicAssets, vite-plugin-compression):
// hosting already compresses at the edge.
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig as defineLovableConfig } from "@lovable.dev/vite-tanstack-config";
import { fileURLToPath } from "node:url";
import type { ConfigEnv, Plugin } from "vite";

const demoClientPath = fileURLToPath(
  new URL("./src/integrations/supabase/demo-client.ts", import.meta.url),
);
const realClientPath = fileURLToPath(
  new URL("./src/integrations/supabase/client.ts", import.meta.url),
);

function normalizePath(value: string): string {
  return value.split("?")[0].replace(/\\/g, "/");
}

const realClientPathPosix = normalizePath(realClientPath);
const realClientPathPosixNoExt = realClientPathPosix.replace(/\.ts$/, "");

function isSupabaseClientSpecifier(source: string, importer?: string): boolean {
  const cleanSource = normalizePath(source);
  if (
    cleanSource === "@/integrations/supabase/client" ||
    cleanSource === "@/integrations/supabase/client.ts"
  )
    return true;
  if (
    cleanSource === "/src/integrations/supabase/client" ||
    cleanSource === "/src/integrations/supabase/client.ts"
  )
    return true;
  if (cleanSource === realClientPathPosix || cleanSource === realClientPathPosixNoExt) return true;
  if (cleanSource === "./client" && importer) {
    return /[\\/]src[\\/]integrations[\\/]supabase[\\/]auth-attacher\.ts$/.test(importer);
  }
  return false;
}

function isRealClientId(id: string): boolean {
  const cleanId = normalizePath(id);
  return (
    cleanId === realClientPathPosix ||
    cleanId === realClientPathPosixNoExt ||
    cleanId === "/src/integrations/supabase/client.ts" ||
    cleanId === "/src/integrations/supabase/client" ||
    cleanId === "@/integrations/supabase/client" ||
    cleanId === "@/integrations/supabase/client.ts"
  );
}

// Troca o client real pelo client simulado em dev/build quando mode = demo.
const demoPlugin: Plugin = {
  name: "startex-demo-supabase-client",
  enforce: "pre",
  resolveId(source, importer) {
    if (isSupabaseClientSpecifier(source, importer)) return demoClientPath;
    return null;
  },
  // O alias/tsconfig-paths resolve "@/integrations/supabase/client" antes deste plugin.
  // Nesses casos o id final é o client real, então trocamos o conteúdo para o demo client.
  load(id) {
    if (isRealClientId(id)) return 'export { supabase } from "./demo-client.ts";\n';
    return null;
  },
};

const baseConfig = {
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
};

const lovableConfig = defineLovableConfig(baseConfig);
const lovableDemoConfig = defineLovableConfig({
  ...baseConfig,
  // Demo é apenas para preview local/teste; o build normal continua em Cloudflare.
  nitro: { preset: "node-server" },
});

export default async (env: ConfigEnv) => {
  const config = await (env.mode === "demo" ? lovableDemoConfig(env) : lovableConfig(env));
  if (env.mode !== "demo") return config;
  return { ...config, plugins: [demoPlugin, ...(config.plugins ?? [])] };
};
