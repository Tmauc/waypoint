# Waypoint — Roadmap & Plan d'action

## Statuts
- `[ ]` À faire
- `[~]` En cours
- `[x]` Terminé

---

## PHASE 1 — Builder (`@waypoint/builder`) ✅ COMPLÈTE
> Objectif : Un `<WaypointBuilder />` embeddable qui génère un JSON versionné auto-suffisant.
> Le JSON doit être parfait avant de passer à la Phase 2.

---

### 1.1 — JSON Schema ✅
- [x] `WaypointSchema` versionné `"1"` dans `packages/core/src/schema.ts`
- [x] `StepDefinition` (id, title, url, fields, visibleWhen, enableResumeFromHere)
- [x] `FieldDefinition` (id, type, label, placeholder, defaultValue, options, validation, visibleWhen, dependsOn)
- [x] `ValidationRule` (required, min, max, minLength, maxLength, email, url, regex, custom)
- [x] `ConditionRule` + `ConditionGroup` (AND/OR, groupes imbriqués, 13 opérateurs)
- [x] `ExternalVariable` (id, label, type, blocking, usedIn)
- [x] `CustomTypeDefinition` (id, label, icon, defaultValidation, metadata)
- [x] `PersistenceMode` (zustand | backend-step | backend-manual)
- [x] Exports depuis `@waypoint/core/src/index.ts`
- [x] 18 tests unitaires

---

### 1.2 — Moteur de conditions (core) ✅
- [x] `packages/core/src/conditions.ts`
  - `resolveFieldValue` — résout `stepId.fieldId` et `$ext.varId`
  - `evaluateConditionGroup` — tous les opérateurs, AND/OR, groupes imbriqués
  - `isVisible` — shorthand (undefined → always true)
- [x] `packages/core/src/tree-resolver.ts`
  - `resolveTree(schema, data, externalVars): ResolvedTree` — steps visibles/cachées, champs visibles, deps
  - `getNextStep` / `getPreviousStep` / `findStepIndex`
  - `calculateProgress` — basé sur l'arbre résolu dynamique
  - `findLastValidStep` — pour le deep-link resume
- [x] 63 tests unitaires (conditions + tree-resolver)
- [x] Total core : 118 tests

---

### 1.3 — Package `@waypoint/builder` ✅
- [x] `packages/builder/` — package.json, tsconfig.json, tsup.config.ts, vite.config.ts (jsdom)
- [x] Dépendances : React peer, zustand, jsdom, vitest
- [x] `builder-store.ts` — store Zustand complet :
  - CRUD steps (add, update, remove, reorder, select)
  - CRUD fields (add, update, remove, reorder, select)
  - Conditions step/field (setStepCondition, setFieldCondition)
  - External variables (add, update, remove)
  - Custom types (add, update, remove)
  - Persistence mode, load/reset schema
- [x] `WaypointBuilder.tsx` — composant racine avec `defaultValue`, `onChange`, `onSave`, `className`, `style`
- [x] `useBuilderStore` exporté publiquement
- [x] 30 tests unitaires du store

---

### 1.4 — UI Steps ✅
- [x] `StepList.tsx` — liste ordonnée, add/remove/reorder
- [x] Badges : "conditional", "needs: StepX", "used by: StepY"
- [x] Boutons ↑↓ **bloqués** si le move violerait une dépendance inter-step
- [x] Banner d'erreur rouge avec message explicite
- [x] `step-dependencies.ts` :
  - `computeStepDependencies` — analyse tous les `dependsOn` + `visibleWhen` inter-steps
  - `isMoveValid` — vérifie la validité d'un reorder
  - `getStepDependencyLabels` — labels lisibles
- [x] 20 tests unitaires step-dependencies

---

### 1.5 — UI Champs ✅
- [x] `FieldList.tsx` — liste des champs d'une step sélectionnée
  - Badges : optional/required/conditional/depends on N/← dependency
  - "needs: FieldX" et "used by: FieldY" (intra-step)
  - Boutons ↑↓ **bloqués** si le move violerait une dépendance intra-step (`isFieldMoveValid`)
  - Banner d'erreur rouge
- [x] `FieldEditor.tsx` — édition complète :
  - Label, placeholder, defaultValue
  - `DependsOnInput` — autocomplete avec tous les champs de l'arbre + `$ext.varId`
  - Visibility condition : résumé + modal
  - Règles de validation (add/edit/remove)
  - Badge optional/required dans le header
- [x] `DependsOnInput.tsx` — tags avec autocomplete, label en grand / path en petit gris
- [x] `isFieldMoveValid` dans `step-dependencies.ts`
- [x] 6 tests unitaires isFieldMoveValid

---

### 1.6 — UI Conditions ✅
- [x] `ConditionBuilder.tsx` — builder visuel complet :
  - Sélecteur de champ (tous les paths de l'arbre via `useAllFieldPaths`)
  - Sélecteur d'opérateur (13 opérateurs)
  - Valeur cible (masquée pour exists/notExists)
  - Toggle AND/OR si plusieurs rules
  - Preview JSON en temps réel
- [x] `Modal.tsx` — modal générique (Escape pour fermer)
- [x] `StepEditor.tsx` — résumé de condition + bouton "Edit/Add condition" → modal
- [x] `FieldEditor.tsx` — même pattern pour les conditions de champ
- [x] `useAllFieldPaths.ts` — hook qui retourne tous les paths disponibles

---

### 1.7 — Variables Externes ✅
- [x] `ExternalVariablePanel` — panel dédié dans le builder (bas de colonne 1)
  - Lister les variables déclarées avec badges type + blocking
  - Ajouter (id, label, type, blocking) via formulaire inline
  - Supprimer
  - Voir quels steps/fields les utilisent (chips bleus avec context label)
  - Edit inline : mise à jour label/type/blocking
  - computeUsageMap : scan visibleWhen + dependsOn pour détecter les `$ext.varId`
- [x] Intégré dans `WaypointBuilder.tsx` — section collapsible bas de colonne 1

---

### 1.8 — Export / Import JSON ✅
- [x] Bouton "Export JSON" — télécharge `{id}.waypoint.json`
- [x] Bouton "Import JSON" — charge un fichier `.json`
- [x] `onSave` callback
- [x] Validation du JSON à l'import : `validateSchema` dans `@waypoint/core/src/validate-schema.ts`
  - Vérifie version, id, name, steps, fields, conditions, validation rules, externalVariables
  - Erreurs accumulées + message détaillé affiché à l'utilisateur
  - `assertSchema` pour usage runtime (lance une exception avec tous les messages)
- [x] 42 tests unitaires (sérialisation, round-trip, chaque règle de validation)
- [x] Tests E2E : export → import → vérifier l'arbre reconstruit ✅

---

### 1.9 — Theming ✅
- [x] `packages/builder/src/theme.ts` — `WaypointTheme` (40+ tokens), `DEFAULT_THEME`, `DARK_THEME`, `buildThemeVars`
- [x] Prop `theme?: WaypointTheme` sur `<WaypointBuilder />` — injecte les CSS variables sur le root element
- [x] Tous les composants migrent des hex hardcodés vers `var(--wp-*)` : WaypointBuilder, Toolbar, StepList, FieldList, StepEditor, FieldEditor, ConditionBuilder, DependsOnInput, Modal, ExternalVariablePanel
- [x] Exports publics : `DEFAULT_THEME`, `DARK_THEME`, `buildThemeVars`, `WaypointTheme`
- [x] Token families : primary, toolbar, canvas/surface, border, text, danger, warning, success, info, radius, font

---

### 1.10 — Tests E2E Builder ✅
- [x] Setup Playwright dans `apps/demo/` (playwright.config.ts, script `test:e2e`)
- [x] 40 tests E2E — 40/40 verts en 16s
  - Initial state : redirect, empty state, examples bar
  - Load example : User Onboarding, conditional badge, Insurance Quote, switch examples
  - Step management : add, select, edit title, remove, dirty flag
  - Field management : show fields, add, select, required badge, remove
  - Step dependency enforcement : needs badge, blocked ↑ button, no error on load
  - Conditions : summary, open/close modal (Done + Escape), add rule, clear
  - External variables : list, add, validate empty id, validate duplicate, cancel, remove
  - Export / Import : download filename, round-trip, reject malformed JSON, reject bad version
  - Toolbar : edit journey name, Save callback, Reset confirm/cancel

---

### Demo — Exemples ✅
- [x] `apps/demo/src/app/builder/page.tsx` — page builder intégrée
- [x] `apps/demo/src/app/builder/examples.ts` — 4 exemples :
  - **User Onboarding** — step company conditionnelle, deps entre champs
  - **Insurance Quote** — step senior selon âge, sous-champ fumeur, var externe
  - **Loan Application** — 5 steps, deps complexes, step mortgage via var externe
  - **E-commerce Checkout** — flow linéaire, champs carte conditionnels
- [x] Barre de boutons au-dessus du builder avec couleur + description

---

## PHASE 2 — Store Core + Runtime

> Démarrer UNIQUEMENT quand le builder génère un JSON parfait et validé (Phase 1 complète).

---

### 2.1 — Nouveau Store (`@waypoint/core`) ✅
- [x] `packages/core/src/runtime-store.ts` — Zustand vanilla store factory
  - `data: Record<stepId, Record<fieldId, any>>`
  - `externalVars: Record<string, any>`
  - `completed: boolean` — flag persisté, mis à `true` quand `onComplete` est appelé
  - Actions : `init`, `resume`, `setFieldValue`, `setStepData`, `setExternalVar`, `setCurrentStep`, `setIsSubmitting`, `setCompleted`, `reset`
  - Persist mode : `persistenceMode: "zustand"` → localStorage persist (SSR-safe)
  - Clé localStorage : `waypoint-runtime-{schemaId}` (isolation par parcours)
  - `PersistedSlice` : `schemaId`, `data`, `currentStepId`, `history`, `completed`
  - `hasPersistedState(store, schemaId)` — retourne `false` si `completed === true` (restart propre)
  - Computed helpers : `getResolvedTree`, `getCurrentStep`, `getNextStepFromState`, `getPreviousStepFromState`, `calculateProgressFromState`, `getMissingBlockingVars`
- [x] Action `resume(schema, externalVars)` — préserve `data + currentStepId + history + completed`, met à jour seulement `schema + externalVars`
- [x] 34 tests unitaires exhaustifs
- [x] `packages/react/src/useWaypoint.ts` — réécriture headless (prend store en param)
- [x] `packages/react/src/useWaypointStep.ts` — hook headless par step (sans router)
- [x] Suppression : `store.ts`, `useWaypointInitializer.ts`, `useStepWaypoint.ts`

---

### 2.2 — Modes de persistance ✅
- [x] Mode Zustand persist (localStorage) — `persistenceMode: "zustand"` dans le schema
- [x] Mode backend-step : `onStepComplete: async (stepId, data) => void` dans WaypointRunner
- [x] Mode backend-manual : callback `onDataChange`
- [x] `onDataChange: (data) => void` — sync vers backend
- [x] `fetchData: async () => data` — hydratation au deep-link

---

### 2.3 — WaypointRunner (`@waypoint/next`) ✅
- [x] `packages/next/src/WaypointRunner.tsx` — Context Provider + init du store
  - Props : `schema`, `externalVars`, `defaultValues`, `fetchData`, `onComplete`, `onStepComplete`, `onDataChange`
  - **Multi-journey** : chaque instance crée son propre store isolé via `useRef` — plusieurs `<WaypointRunner>` peuvent coexister sans interférence
  - **Pause & Resume** : au montage, si `hasPersistedState()` → `resume()` (données + position préservées) ; sinon `init()` + `findLastValidStep` pour deep-link
  - Un parcours `completed` est exclu du resume → redémarre depuis zéro
  - ErrorBoundary explicite si variables bloquantes manquantes
- [x] `packages/next/src/context.ts` — `WaypointRuntimeContext` + `useWaypointRuntimeContext`

---

### 2.4 — Controllers react-hook-form (`@waypoint/next`) ✅
- [x] `packages/next/src/useWaypointStep.ts`
  - Retourne : `{ currentStep, fields, form, handleSubmit, goBack, progress, isFirstStep, isLastStep, isSubmitting, errors }`
  - `handleSubmit` : valide (Zod) + stocke + `onStepComplete` + `router.push` automatique
  - `fields` : uniquement les champs visibles du step courant
- [x] `packages/core/src/zod-generator.ts` — `buildZodSchema(fields)` → ZodObject
  - Tous les types : required, min, max, minLength, maxLength, email, url, regex, custom
  - Champs number : `z.coerce.number()`
  - Champs checkbox : `z.boolean()`
  - Champs invisibles exclus du schema
- [x] 15 tests unitaires zod-generator

---

### 2.5 — Navigation avancée (`@waypoint/next`) ✅
- [x] `goNext` / `goBack` sur l'arbre résolu (skip steps conditionnelles cachées)
- [x] Blocage si variable externe bloquante manquante → erreur UI
- [x] Progress calculé sur l'arbre résolu dynamique
- [x] `setCompleted(true)` dans `handleSubmit` avant `onComplete` → flag persisté en localStorage

---

### 2.x — Demo multi-parcours ✅
- [x] `apps/demo/src/app/journeys/` — dashboard de démonstration du multi-parcours
  - `page.tsx` — dashboard : lit le localStorage de chaque parcours, affiche statut (non démarré / en cours / terminé ✓)
  - Boutons **Commencer** / **Reprendre** (avec URL exacte de la step courante) / **Réinitialiser**
  - Indicateur visuel des steps complétées, badge "En cours" / "Terminé ✓"
  - Section "Comment tester le multi-parcours ?" inline
- [x] Parcours **Création de projet** (`/journeys/project/`, schema `project-creation`)
  - 4 steps : informations, équipe (conditionnelle si `type=pro`), budget, lancement
  - Step équipe cachée automatiquement si type = personnel
- [x] Parcours **Versement** (`/journeys/deposit/`, schema `deposit`)
  - 3 steps : compte, versement, confirmation
- [x] `_components/StepRenderer.tsx` — composant UI partagé (breadcrumb, progress bar, champs, navigation)
- [x] Lien "Journeys" ajouté dans la nav globale de la demo

---

### 2.6 — `@waypoint/devtools` ✅
- [x] Package `packages/devtools/` — `package.json`, `tsconfig.json`, `tsup.config.ts`
- [x] `WaypointDevtools` — guard `NODE_ENV !== "development"` → no-op en prod (tree-shaken)
- [x] `DevPanel` — drawer slide depuis la droite, bouton toggle fixe en bas-droite
  - Section **Navigation** : schema id/name, barre de progression, arbre résolu (current/done/upcoming), steps cachées
  - Section **Données** : accordéon par stepId, step courante mise en évidence, `JsonView` collapsible
  - Section **Variables externes** : valeur + badges `blocking` / `missing` / `undefined`
  - Section **Historique** : liste ordonnée des stepIds visités
  - Section **État brut** : dump JSON complet collapsible
- [x] `JsonView` — rendu récursif inline (primitives colorées, objects/arrays collapsibles)
- [x] Styles inline exclusivement — zéro conflit Tailwind, zéro dépendance CSS
- [x] Hydration SSR-safe : guard `isMounted` via `useEffect`
- [x] Badge `!` rouge sur le toggle si variables bloquantes manquantes
- [x] Intégré dans `journeys/project/layout.tsx` et `journeys/deposit/layout.tsx`

---

### 2.7 — Tests E2E Runtime [ ]
- [ ] Navigation avec conditions dynamiques, blocage, progress
- [ ] Deep-link → redirect automatique
- [ ] Variable externe manquante → erreur
- [ ] A/B testing (deux versions)
- [ ] Persistance backend (onStepComplete async)

---

## État des tests

| Package | Tests | Statut |
|---|---|---|
| `@waypoint/core` | 196 | ✅ tous verts (Phase 1 + 34 runtime-store + 15 zod-generator) |
| `@waypoint/builder` | 50 | ✅ tous verts |
| `apps/demo` (E2E) | 40 | ✅ tous verts |
| **Total** | **286** | ✅ |

---

## Structure des fichiers clés

```
packages/
├── core/src/
│   ├── schema.ts          — WaypointSchema + tous les types
│   ├── conditions.ts      — évaluation des conditions
│   ├── tree-resolver.ts   — résolution de l'arbre dynamique
│   ├── runtime-store.ts   — store Zustand vanilla (Phase 2) ✅
│   │                          completed, resume(), setCompleted(), hasPersistedState()
│   ├── zod-generator.ts   — ValidationRule[] → ZodSchema (Phase 2) ✅
│   ├── types.ts           — types legacy (JourneyTreeType etc.)
│   └── index.ts           — exports publics
├── next/src/
│   ├── WaypointRunner.tsx — Context Provider + init/resume/multi-journey ✅
│   ├── useWaypointStep.ts — hook RHF + Zod + setCompleted ✅
│   ├── context.ts         — WaypointRuntimeContext ✅
│   └── index.ts
├── react/src/
│   ├── useWaypoint.ts     — hook headless (sans router) ✅
│   └── useWaypointStep.ts — hook headless par step ✅
├── builder/src/
│   ├── components/
│   │   ├── WaypointBuilder.tsx  — composant racine
│   │   ├── StepList.tsx         — liste steps + dep enforcement
│   │   ├── StepEditor.tsx       — config step + condition modal
│   │   ├── FieldList.tsx        — liste fields + dep enforcement
│   │   ├── FieldEditor.tsx      — edit field + DependsOnInput + validation
│   │   ├── ConditionBuilder.tsx — builder visuel de conditions
│   │   ├── DependsOnInput.tsx   — autocomplete multi-tags
│   │   ├── Modal.tsx            — modal générique
│   │   └── Toolbar.tsx          — export/import/save/reset
│   ├── store/
│   │   └── builder-store.ts     — store Zustand du builder
│   ├── hooks/
│   │   └── useAllFieldPaths.ts  — tous les paths de l'arbre
│   └── utils/
│       └── step-dependencies.ts — computeStepDeps, isMoveValid, isFieldMoveValid
apps/
└── demo/src/app/
    ├── builder/
    │   ├── page.tsx     — page demo avec ExamplesBar
    │   └── examples.ts  — 4 schemas d'exemple
    └── journeys/        — demo multi-parcours pause/resume ✅ (devtools intégré)
        ├── page.tsx                    — dashboard (statut + Commencer/Reprendre)
        ├── _components/StepRenderer.tsx — UI partagée
        ├── project/                    — parcours Création de projet
        └── deposit/                    — parcours Versement
```

---

## Branche git active
`feat/builder`

## Prochaine étape
**Phase 2.7 — Tests E2E Runtime** :
- Phase 2.1–2.6 complète ✅
- Multi-parcours pause/resume ✅ · Devtools ✅
- Prochaine étape : tests E2E runtime (navigation, conditions dynamiques, deep-link, pause/resume, variable externe manquante).
