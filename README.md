<div align="center">

# ◈ waypoint

**Schema-driven multi-step journey framework for React & Next.js**

[![npm version](https://img.shields.io/npm/v/@waypointjs/core?color=00d4ff&label=%40waypoint%2Fcore&style=flat-square)](https://www.npmjs.com/package/@waypointjs/core)
[![npm version](https://img.shields.io/npm/v/@waypointjs/react?color=8b5cf6&label=%40waypoint%2Freact&style=flat-square)](https://www.npmjs.com/package/@waypointjs/react)
[![npm version](https://img.shields.io/npm/v/@waypointjs/next?color=22c55e&label=%40waypoint%2Fnext&style=flat-square)](https://www.npmjs.com/package/@waypointjs/next)
[![npm version](https://img.shields.io/npm/v/@waypointjs/builder?color=f59e0b&label=%40waypoint%2Fbuilder&style=flat-square)](https://www.npmjs.com/package/@waypointjs/builder)
[![License: MIT](https://img.shields.io/badge/license-MIT-white?style=flat-square)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

<br/>

*Versioned schema · Conditional steps & fields · Zod validation · No-code builder · Resume support*

[Documentation](https://waypoint-docs.vercel.app) · [Getting Started](https://waypoint-docs.vercel.app/getting-started) · [API Reference](https://waypoint-docs.vercel.app/api/use-waypoint)

</div>

---

## What is Waypoint?

Waypoint turns complex multi-step flows — onboarding, checkout, wizards, quote forms — into a **portable JSON schema** you can build visually, validate strictly, and render anywhere.

Define your entire journey once (`WaypointSchema`), drop in `<WaypointRunner>` as a layout provider, and call `useWaypointStep()` in each page. Waypoint handles field resolution, conditional logic, Zod validation, progress tracking and localStorage persistence automatically.

---

## Features

- **Versioned JSON schema** — steps, fields, validation rules and conditions in one portable object; commit it, share it, pass it as a prop
- **Conditional logic** — show/hide steps and fields with a composable AND/OR engine (13 operators, nested groups, external variables)
- **Zod validation** — `buildZodSchema()` auto-generates a Zod schema from your field definitions; `useWaypointStep()` wires it to react-hook-form
- **Progress tracking** — always reflects the real number of visible steps after condition evaluation
- **Resume & persistence** — localStorage via Zustand persist middleware; deep-links users to their last valid step on return
- **No-code builder** — `<WaypointBuilder>` is an embeddable 3-column editor with a live preview/test mode
- **Isolated multi-journey** — each `<WaypointRunner>` creates its own store; run concurrent journeys with no shared state
- **Framework-agnostic core** — `@waypointjs/react` headless hooks work with any router

---

## Packages

| Package | Description |
|---|---|
| [`@waypointjs/core`](./packages/core) | Schema types · condition engine · tree resolver · Zustand runtime store · Zod generator |
| [`@waypointjs/react`](./packages/react) | Headless hooks: `useWaypoint`, `useWaypointStep` — router-agnostic |
| [`@waypointjs/next`](./packages/next) | Next.js App Router: `WaypointRunner` provider + `useWaypointStep` with RHF + Zod |
| [`@waypointjs/builder`](./packages/builder) | Embeddable no-code schema editor with live preview mode |

---

## Quick start

### Installation

```bash
# Next.js App Router
pnpm add @waypointjs/next @waypointjs/core

# React (any router)
pnpm add @waypointjs/react @waypointjs/core
```

### 1. Define a schema

```ts
// lib/onboarding.schema.ts
import type { WaypointSchema } from "@waypointjs/core";

export const schema: WaypointSchema = {
  version: "1",
  id: "onboarding",
  name: "User Onboarding",
  persistenceMode: "zustand",   // auto-save to localStorage
  steps: [
    {
      id: "personal",
      title: "Personal info",
      url: "/onboarding/personal",
      fields: [
        { id: "name",  type: "text",  label: "Full name",
          validation: [{ type: "required", message: "Required" }] },
        { id: "email", type: "email", label: "Email address",
          validation: [{ type: "required", message: "Required" }, { type: "email", message: "Invalid email" }] },
        { id: "role",  type: "select", label: "Account type",
          options: [{ label: "Personal", value: "personal" }, { label: "Business", value: "business" }],
          validation: [{ type: "required", message: "Required" }] },
      ],
    },
    {
      id: "company",
      title: "Company details",
      url: "/onboarding/company",
      // Only shown when role === "business"
      visibleWhen: {
        combinator: "and",
        rules: [{ field: "personal.role", operator: "equals", value: "business" }],
      },
      fields: [
        { id: "companyName", type: "text", label: "Company name",
          validation: [{ type: "required", message: "Required" }] },
      ],
    },
    {
      id: "confirm",
      title: "Confirm",
      url: "/onboarding/confirm",
      fields: [],
    },
  ],
};
```

### 2. Add WaypointRunner to your layout

```tsx
// app/onboarding/layout.tsx
"use client";

import { WaypointRunner } from "@waypointjs/next";
import { schema } from "@/lib/onboarding.schema";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <WaypointRunner
      schema={schema}
      onComplete={async (data) => {
        await fetch("/api/onboarding", { method: "POST", body: JSON.stringify(data) });
      }}
    >
      {children}
    </WaypointRunner>
  );
}
```

### 3. Use `useWaypointStep` in each page

```tsx
// app/onboarding/personal/page.tsx  (same pattern for every step)
"use client";

import { useWaypointStep } from "@waypointjs/next";

export default function PersonalPage() {
  const { fields, form, handleSubmit, goBack, progress, isFirstStep, isLastStep } =
    useWaypointStep();

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)}>
      <div style={{ width: `${progress}%`, height: 4, background: "blue" }} />

      {fields.map((field) => (
        <div key={field.definition.id}>
          <label>{field.definition.label}</label>
          <input
            type={field.definition.type}
            {...form.register(field.definition.id)}
          />
          {form.formState.errors[field.definition.id] && (
            <span>{String(form.formState.errors[field.definition.id]?.message)}</span>
          )}
        </div>
      ))}

      {!isFirstStep && <button type="button" onClick={goBack}>← Back</button>}
      <button type="submit">{isLastStep ? "Finish ✓" : "Continue →"}</button>
    </form>
  );
}
```

The `company` step appears automatically when the user selects `"business"` — no routing code needed.

---

## No-code builder

Drop `<WaypointBuilder>` into any admin page to let non-developers create and edit journey schemas:

```tsx
"use client";

import { WaypointBuilder } from "@waypointjs/builder";

export default function AdminBuilderPage() {
  return (
    <div style={{ height: "100vh" }}>
      <WaypointBuilder
        onSave={async (schema) => {
          await fetch("/api/schemas", { method: "POST", body: JSON.stringify(schema) });
        }}
      />
    </div>
  );
}
```

The builder includes a **▶ Tester** button that opens a live preview mode — navigate through the journey, test conditions, and validate fields without leaving the editor.

---

## Architecture

```
WaypointSchema (JSON)
       │
       ▼
WaypointRunner              ← creates isolated Zustand store per journey
       │
       ├── resolveTree()    ← evaluates conditions → visible steps & fields
       │
       ├── useWaypointStep()  ← per-page: RHF + Zod + navigation
       │       │
       │       ├── buildZodSchema(fields)   ← auto-generated from ValidationRule[]
       │       └── handleSubmit()           ← validate → persist → navigate
       │
       └── localStorage persistence (when persistenceMode: "zustand")
```

`resolveTree()` is a **pure function** — it takes `(schema, data, externalVars)` and returns the visible steps and fields. It runs on every data change, so conditional steps appear and disappear in real time.

---

## Monorepo structure

```
waypoint/
├── packages/
│   ├── core/       @waypointjs/core    — schema, conditions, tree resolver, store, Zod
│   ├── react/      @waypointjs/react   — headless hooks (useWaypoint, useWaypointStep)
│   ├── next/       @waypointjs/next    — WaypointRunner + Next.js useWaypointStep
│   └── builder/    @waypointjs/builder — no-code editor component
└── apps/
    ├── demo/       interactive demo (Next.js)
    └── docs/       documentation site (Nextra)
```

Built with [pnpm workspaces](https://pnpm.io/workspaces), [Turbo](https://turbo.build/), [tsup](https://tsup.egoist.dev/), and [Vitest](https://vitest.dev/).

---

## AI Agent Skill

Waypoint ships an [Agent Skill](https://agentskills.io) for Claude Code and other compatible agents. The skill gives your agent full context on the API, patterns, and critical rules — without having to explore the codebase.

**Install via [skills.sh](https://skills.sh):**

```bash
# Claude Code only
npx skills add tmauc/waypoint -a claude-code

# All compatible agents
npx skills add tmauc/waypoint --all
```

**Or install manually:**

```bash
# Copy the skill to your Claude skills directory
cp -r .claude/skills/waypoint ~/.claude/skills/waypoint
```

The skill lives at [`.claude/skills/waypoint/`](./.claude/skills/waypoint/) in this repo and covers all four packages with detailed API references.

---

## Development

```bash
git clone https://github.com/tmauc/waypoint.git
cd waypoint
pnpm install

# Build all packages
pnpm build

# Run all tests
pnpm test

# Start demo app (localhost:3001)
pnpm dev --filter=demo

# Start docs site (localhost:3002)
pnpm dev --filter=docs
```

---

## License

MIT — see [LICENSE](./LICENSE).
