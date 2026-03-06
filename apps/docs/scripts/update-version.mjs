#!/usr/bin/env node
/**
 * Lit la version de @waypointjs/core et met à jour HeroSection.tsx
 * Appelé automatiquement par `pnpm version-packages`
 */

import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "../../../");

// Lire la version depuis @waypointjs/core
const corePkg = JSON.parse(
  readFileSync(resolve(root, "packages/core/package.json"), "utf-8")
);
const version = corePkg.version;

// Mettre à jour HeroSection.tsx
const heroPath = resolve(__dirname, "../src/components/HeroSection.tsx");
const hero = readFileSync(heroPath, "utf-8");
const updated = hero.replace(/v\d+\.\d+\.\d+ — Beta/, `v${version} — Beta`);

if (hero === updated) {
  console.log(`✓ HeroSection.tsx already at v${version}`);
} else {
  writeFileSync(heroPath, updated);
  console.log(`✓ HeroSection.tsx updated to v${version}`);
}
