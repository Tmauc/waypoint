# Checklist — Ajouter une nouvelle feature à Waypoint

À chaque nouvelle feature significative (nouveau type de champ, nouvel opérateur, nouvelle prop, nouveau hook, nouveau mode de persistance, etc.), parcourir cette liste dans l'ordre.

---

## 1. Code source — packages/

### `packages/core/src/`
- [ ] **Types** (`types.ts`) — ajouter/modifier les interfaces concernées (`WaypointSchema`, `StepDefinition`, `FieldDefinition`, `ConditionOperator`, etc.)
- [ ] **Logique** — implémenter dans le bon fichier (`tree-resolver.ts`, `runtime-store.ts`, `zod-generator.ts`, `conditions.ts`, `schema-validator.ts`)
- [ ] **Exports** (`index.ts`) — exporter les nouveaux symboles publics
- [ ] **Tests unitaires** (`src/__tests__/`) — couvrir les cas nominaux et les edge cases

### `packages/react/src/`
- [ ] Mettre à jour `useWaypoint.ts` ou `useWaypointStep.ts` si la feature expose de nouveaux états ou actions
- [ ] Mettre à jour les return types (`WaypointState`, `WaypointHeadlessStep`)
- [ ] Mettre à jour `index.ts` si nouveaux exports

### `packages/next/src/`
- [ ] Mettre à jour `WaypointRunner.tsx` si nouvelles props (`WaypointRunnerProps`)
- [ ] Mettre à jour `useWaypointStep.ts` si la feature impacte la navigation, la validation ou les callbacks
- [ ] Mettre à jour `context.ts` si le contexte change
- [ ] Mettre à jour `index.ts` si nouveaux exports

### `packages/builder/src/`
- [ ] **Store** (`store/builder-store.ts`) — ajouter l'état et les actions correspondants si la feature est éditable dans le builder
- [ ] **UI** — créer ou mettre à jour le composant d'édition approprié :
  - Nouveau type de champ → `FieldEditor.tsx` (section type + options spécifiques)
  - Nouvel opérateur → `ConditionBuilder.tsx`
  - Nouvelle prop de step → `StepEditor.tsx`
  - Nouvelle variable externe → `ExternalVariablePanel.tsx`
- [ ] **Preview** (`PreviewPanel.tsx`) — ajouter le rendu du nouveau type si c'est un `FieldType`
- [ ] Mettre à jour `index.ts` si nouveaux exports publics

---

## 2. Documentation — apps/docs/

### Landing page (`apps/docs/src/components/`)
- [ ] `FeaturesSection.tsx` — ajouter ou mettre à jour la feature card si c'est une capacité visible par l'utilisateur final
- [ ] `CodeSection.tsx` — mettre à jour l'exemple de code si le workflow de base change
- [ ] `PackagesSection.tsx` — mettre à jour si un nouveau package est ajouté

### Pages MDX (`apps/docs/pages/`)
- [ ] **Introduction** (`introduction.mdx`) — si le workflow global change
- [ ] **Getting Started** (`getting-started.mdx`) — si les étapes d'installation ou de setup changent
- [ ] **Concepts** — mettre à jour la page concernée :
  - `concepts/journey-tree.mdx` → types de champs, structure du schema
  - `concepts/history.mdx` → résolution de l'arbre, navigation
  - `concepts/progress.mdx` → conditions, opérateurs
  - `concepts/multi-journey.mdx` → persistance, modes
- [ ] **API Reference** — mettre à jour la page du package concerné :
  - `api-reference/core.mdx`
  - `api-reference/react.mdx`
  - `api-reference/next.mdx`
  - `api-reference/builder.mdx`
- [ ] **AI & Skills** (`ai.mdx`) — mettre à jour la section "What's Included" si les packages ou leurs APIs bougent
- [ ] **llms.txt** (`public/llms.txt`) — mettre à jour si une nouvelle page est ajoutée à la doc
- [ ] **llms-full.txt** — regénérer via `node scripts/generate-llms.mjs` (ou automatiquement au `pnpm build`)
- [ ] **Guides** — créer ou mettre à jour un guide si la feature mérite un exemple end-to-end :
  - `guides/url-templates.mdx` — Next.js / routing
  - `guides/resume.mdx` — usage headless
  - `guides/builder.mdx` — usage du builder

---

## 3. Agent Skill — .claude/skills/waypoint/

- [ ] `SKILL.md` — mettre à jour la section "Key Patterns" ou "Critical Rules" si la feature introduit un nouveau pattern ou une règle à ne pas oublier
- [ ] `references/core.md` — si la feature est dans `@waypoint/core` (nouveaux types, fonctions, actions du store)
- [ ] `references/react.md` — si la feature change `useWaypoint` ou `useWaypointStep` headless
- [ ] `references/next.md` — si la feature change `WaypointRunner`, `useWaypointStep` Next.js, ou le contexte
- [ ] `references/builder.md` — si la feature change `WaypointBuilder`, le thème, ou `useBuilderStore`

---

## 4. Demo — apps/demo/

- [ ] Ajouter ou mettre à jour un journey existant pour illustrer la feature :
  - `apps/demo/src/app/journeys/project/schema.ts`
  - `apps/demo/src/app/journeys/deposit/schema.ts`
- [ ] Mettre à jour `StepRenderer.tsx` si un nouveau type de champ est ajouté
- [ ] Créer un nouveau journey si la feature est suffisamment distincte

---

## 5. Plan & suivi — .plan/

- [ ] `ROADMAP.md` — cocher la tâche correspondante ✅ ou ajouter une entrée si c'était non planifié
- [ ] `REQUIREMENTS.md` — mettre à jour si les besoins ont évolué

---

## 6. README (racine)

- [ ] Mettre à jour la section Features si la feature est visible par l'utilisateur final
- [ ] Mettre à jour l'exemple de code Quick Start si le workflow de base change

---

## Référence rapide — quel fichier pour quoi

| Je change… | Fichiers impactés |
|---|---|
| Un nouveau type de champ (`FieldType`) | `core/types.ts`, `core/zod-generator.ts`, `builder/FieldEditor.tsx`, `builder/PreviewPanel.tsx`, `docs/api-reference/core.mdx`, `docs/concepts/journey-tree.mdx`, `skill/references/core.md` |
| Un nouvel opérateur de condition | `core/types.ts`, `core/conditions.ts`, `builder/ConditionBuilder.tsx`, `docs/api-reference/core.mdx`, `docs/concepts/progress.mdx`, `skill/references/core.md`, `skill/SKILL.md` |
| Une nouvelle prop de `WaypointRunner` | `next/WaypointRunner.tsx`, `next/context.ts`, `docs/api-reference/next.mdx`, `skill/references/next.md` |
| Une nouvelle action du store | `core/runtime-store.ts`, `react/useWaypoint.ts`, `docs/api-reference/core.mdx`, `skill/references/core.md` |
| Un nouveau mode de persistance | `core/runtime-store.ts`, `core/types.ts`, `next/WaypointRunner.tsx`, `docs/concepts/multi-journey.mdx`, `docs/api-reference/next.mdx`, `skill/SKILL.md`, `skill/references/next.md` |
| Une prop du builder | `builder/WaypointBuilder.tsx`, `docs/api-reference/builder.mdx`, `skill/references/builder.md` |
| Un nouveau token de thème | `builder/theme.ts`, `docs/api-reference/builder.mdx`, `skill/references/builder.md` |
| Un nouveau hook headless | `react/useWaypoint.ts` ou `useWaypointStep.ts`, `react/index.ts`, `docs/api-reference/react.mdx`, `skill/references/react.md` |
| Un nouveau package entier | `packages/`, `apps/docs/src/components/PackagesSection.tsx`, `docs/pages/_meta.json`, `docs/api-reference/_meta.json`, nouvelle page `api-reference/*.mdx`, `skill/SKILL.md`, nouveau `skill/references/*.md`, `README.md` |
