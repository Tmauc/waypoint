<div align="center">

# waypoint

**Multi-step journey navigation for React & Next.js**

[![npm version](https://img.shields.io/npm/v/@waypoint/core?color=00d4ff&label=%40waypoint%2Fcore&style=flat-square)](https://www.npmjs.com/package/@waypoint/core)
[![npm version](https://img.shields.io/npm/v/@waypoint/react?color=8b5cf6&label=%40waypoint%2Freact&style=flat-square)](https://www.npmjs.com/package/@waypoint/react)
[![npm version](https://img.shields.io/npm/v/@waypoint/next?color=22c55e&label=%40waypoint%2Fnext&style=flat-square)](https://www.npmjs.com/package/@waypoint/next)
[![License: MIT](https://img.shields.io/badge/license-MIT-white?style=flat-square)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Built with Turbo](https://img.shields.io/badge/built%20with-Turbo-ef4444?style=flat-square)](https://turbo.build/)

<br/>

*Declarative journey trees · Smart history · Progress tracking · Resume support*

[Documentation](https://waypoint-docs.vercel.app) · [Getting Started](https://waypoint-docs.vercel.app/getting-started) · [API Reference](https://waypoint-docs.vercel.app/api)

</div>

---

## The problem

Building multi-step flows (onboarding, wizards, funnels) in React is surprisingly painful. You end up hand-rolling:

- URL management and history tracking
- Back-button behaviour and step ordering
- Progress calculation
- Resume logic (where did the user leave off?)
- Coordinating multiple concurrent flows

Waypoint handles all of it — in ~3 kB.

---

## Features

- **Journey trees** — define your flow as a declarative tree with categories and steps
- **Smart history** — automatic back/forward navigation with `purge-future` semantics
- **Progress tracking** — built-in `0–100` progress per journey, updated automatically
- **Resume support** — deep-link users back to their last visited step
- **Multi-journey** — run isolated parallel journeys (wizard-within-wizard, etc.)
- **URL templates** — typed `{{PARAM}}` placeholders with automatic extraction
- **Framework-agnostic core** — works with any router via a minimal adapter interface
- **Zero config for Next.js** — `@waypoint/next` wires up App Router automatically

---

## Packages

| Package | Description | Size |
|---|---|---|
| [`@waypoint/core`](./packages/core) | Store, URL engine, utilities — no framework dependency | ~3 kB |
| [`@waypoint/react`](./packages/react) | Hooks: `useWaypoint`, `useWaypointInitializer`, `useStepWaypoint` | ~2 kB |
| [`@waypoint/next`](./packages/next) | Next.js App Router drop-in — zero config needed | ~1 kB |

---

## Quick start

### Installation

```bash
# Next.js
pnpm add @waypoint/next

# React (any router)
pnpm add @waypoint/react

# Core only
pnpm add @waypoint/core
```

### 1. Define your journey tree

```ts
// journeys/onboarding.ts
import type { JourneyTreeType } from "@waypoint/core";

export const ONBOARDING_JOURNEY_ID = "onboarding";

export const onboardingTree: JourneyTreeType = [
  {
    category: "account",
    steps: [
      { step: "welcome",  url: "/onboarding/welcome" },
      { step: "profile",  url: "/onboarding/profile" },
    ],
  },
  {
    category: "setup",
    steps: [
      { step: "preferences", url: "/onboarding/preferences", enableResumeFromHere: true },
      { step: "confirm",     url: "/onboarding/confirm" },
    ],
  },
];
```

> URL templates support typed parameters: `"/projects/{{projectId}}/step/{{stepSlug}}"`

### 2. Initialize the journey

```tsx
// app/onboarding/layout.tsx  (Next.js App Router)
"use client";

import { useWaypointInitializer } from "@waypoint/next";
import { ONBOARDING_JOURNEY_ID, onboardingTree } from "@/journeys/onboarding";

export default function OnboardingLayout({ children }) {
  const { isReady } = useWaypointInitializer({
    journeyId: ONBOARDING_JOURNEY_ID,
    tree: onboardingTree,
  });

  if (!isReady) return null;
  return <>{children}</>;
}
```

### 3. Navigate from any step

```tsx
// app/onboarding/profile/page.tsx
"use client";

import { useWaypoint } from "@waypoint/next";
import { useStepWaypoint } from "@waypoint/next";
import { ONBOARDING_JOURNEY_ID } from "@/journeys/onboarding";

export default function ProfilePage() {
  // Declare current step (syncs store with current URL)
  useStepWaypoint({ journeyId: ONBOARDING_JOURNEY_ID, step: "profile" });

  const { goNext, goBack, urls } = useWaypoint({ journeyId: ONBOARDING_JOURNEY_ID });

  return (
    <form onSubmit={() => goNext()}>
      {/* ... */}
      <button type="button" onClick={() => goBack()}>Back</button>
      <button type="submit">Continue → {urls.next}</button>
    </form>
  );
}
```

### URL parameters

```tsx
// Tree step: { step: "project-details", url: "/projects/{{projectId}}/details" }

const { goNext, extractedParams } = useWaypoint({ journeyId: "my-journey" });

// Parameters are extracted from the current URL automatically
console.log(extractedParams); // { projectId: "abc-123" }

// And forwarded automatically on navigation
goNext(); // → /projects/abc-123/next-step

// Or override explicitly
goNext({ projectId: "xyz-456" });
```

### Progress tracking

```tsx
import { useWaypointStore } from "@waypoint/core";

const progress = useWaypointStore(
  (s) => s.getJourney("onboarding")?.progress ?? 0
);

// progress = 0 → 100, calculated automatically as steps are visited
<ProgressBar value={progress} />
```

### Resume support

```ts
// Mark a step as the resume point
{ step: "preferences", url: "/...", enableResumeFromHere: true }

// On next visit, useWaypointInitializer will redirect straight there
// instead of restarting from step 1
```

---

## How it works

```
useWaypointInitializer     useStepWaypoint
        │                       │
        ▼                       ▼
  ┌─────────────────────────────────────┐
  │         useWaypointStore            │  ← Zustand store (singleton)
  │  journeys: Map<id, JourneyState>    │
  │  activeJourneyId: string | null     │
  └─────────────────────────────────────┘
        │
        ▼
  ┌─────────────────┐    ┌──────────────────────┐
  │   useWaypoint   │    │  URLTemplateEngine   │
  │  goNext / goBack│    │  format / validate   │
  │  urls / progress│    │  extractParams       │
  └─────────────────┘    └──────────────────────┘
        │
        ▼
  router.push(resolvedURL)   ← your framework's router
```

The store is framework-agnostic. `@waypoint/react` adds hooks on top. `@waypoint/next` wires `useRouter` / `usePathname` automatically so you never touch the adapter directly.

---

## Monorepo structure

```
waypoint/
├── packages/
│   ├── core/       @waypoint/core   — store, URL engine, utils
│   ├── react/      @waypoint/react  — React hooks
│   └── next/       @waypoint/next   — Next.js App Router integration
└── apps/
    ├── demo/       interactive demo (Next.js)
    └── docs/       documentation site (Nextra)
```

Built with [Turbo](https://turbo.build/), [tsup](https://tsup.egoist.dev/), and [Vitest](https://vitest.dev/).

---

## Development

```bash
# Clone and install
git clone https://github.com/mauconduit/waypoint.git
cd waypoint
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test

# Start demo app (port 3001)
pnpm dev --filter=demo

# Start docs site (port 3002)
pnpm dev --filter=docs
```

---

## License

MIT — see [LICENSE](./LICENSE).
