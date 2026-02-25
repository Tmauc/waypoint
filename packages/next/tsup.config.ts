import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  clean: true,
  external: ["react", "next", "zustand"],
  treeshake: true,
  // Preserve "use client" directive for Next.js RSC compatibility
  banner: { js: '"use client";' },
});
