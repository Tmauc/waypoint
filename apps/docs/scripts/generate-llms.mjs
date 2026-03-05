#!/usr/bin/env node
/**
 * Generates /public/llms-full.txt by concatenating all MDX pages.
 * Run: node scripts/generate-llms.mjs
 * Or automatically via: "prebuild": "node scripts/generate-llms.mjs"
 */

import { readFileSync, readdirSync, writeFileSync, statSync } from "fs";
import { join, relative } from "path";

const PAGES_DIR = new URL("../pages", import.meta.url).pathname;
const OUT_FILE = new URL("../public/llms-full.txt", import.meta.url).pathname;

const HEADER = `# Waypoint — Full Documentation

> Schema-driven multi-step journey framework for React & Next.js

`;

// Collect MDX files in a readable order
const ORDER = [
  "introduction.mdx",
  "getting-started.mdx",
  "concepts/journey-tree.mdx",
  "concepts/history.mdx",
  "concepts/progress.mdx",
  "concepts/multi-journey.mdx",
  "api-reference/core.mdx",
  "api-reference/react.mdx",
  "api-reference/next.mdx",
  "api-reference/builder.mdx",
  "guides/url-templates.mdx",
  "guides/resume.mdx",
  "guides/builder.mdx",
  "ai.mdx",
];

function stripFrontmatter(content) {
  return content.replace(/^---[\s\S]*?---\n/, "").trim();
}

function stripImports(content) {
  return content.replace(/^import\s+.*$/gm, "").trim();
}

function stripMdxComponents(content) {
  // Remove Nextra/MDX component wrappers like <Callout>, <Tabs>, etc.
  return content
    .replace(/<Callout[^>]*>([\s\S]*?)<\/Callout>/g, (_, inner) => inner.trim())
    .replace(/<Tabs[^>]*>[\s\S]*?<\/Tabs>/g, "")
    .replace(/<[A-Z][a-zA-Z.]*[^>]*\/>/g, "")
    .replace(/<div[^>]*>/g, "")
    .replace(/<\/div>/g, "")
    .trim();
}

let output = HEADER;

for (const relPath of ORDER) {
  const fullPath = join(PAGES_DIR, relPath);
  try {
    let content = readFileSync(fullPath, "utf-8");
    content = stripFrontmatter(content);
    content = stripImports(content);
    content = stripMdxComponents(content);
    output += `\n\n---\n\n${content}`;
  } catch {
    console.warn(`  ⚠ Skipping ${relPath} (not found)`);
  }
}

writeFileSync(OUT_FILE, output.trim() + "\n");
console.log(`✓ llms-full.txt generated (${(output.length / 1024).toFixed(1)} KB)`);
