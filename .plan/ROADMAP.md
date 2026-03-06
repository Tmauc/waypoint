# Waypoint — Roadmap & Plan d'action

## Statuts
- `[ ]` À faire
- `[~]` En cours
- `[x]` Terminé

---

## PHASE 1 — Builder (`@waypointjs/builder`) ✅ COMPLÈTE
> Objectif : Un `<WaypointBuilder />` embeddable qui génère un JSON versionné auto-suffisant.
> Le JSON doit être parfait avant de passer à la Phase 2.

---

### 1.1 — JSON Schema ✅
- [x] `WaypointSchema` versionné `"1"` dans `packages/core/src/schema.ts`
- [x] `StepDefinition` (id, title, url, fields, visibleWhen, enableResumeFromHere)
- [x] `FieldDefinition` (id, type, label, placeholder, defaultValue, options, validation, visibleWhen, dependsOn)
- [x] `ValidationRule` (required, min, max, minLength, maxLength, email, url, regex, custom)
- [x] `ConditionRule` + `ConditionGroup` (AND/OR, groupes imbriqués, 15 opérateurs dont `inEnum`/`notInEnum`)
- [x] `ExternalVariable` (id, label, type, blocking, usedIn)
- [x] `CustomTypeDefinition` (id, label, icon, defaultValidation, metadata)
- [x] `PersistenceMode` (zustand | backend-step | backend-manual)
- [x] Exports depuis `@waypointjs/core/src/index.ts`
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

### 1.3 — Package `@waypointjs/builder` ✅
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
- [x] Validation du JSON à l'import : `validateSchema` dans `@waypointjs/core/src/validate-schema.ts`
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

### 1.11 — Mode Preview dans le Builder ✅
- [x] `packages/builder/package.json` — ajout dépendance `@waypointjs/react`
- [x] `packages/builder/src/components/PreviewPanel.tsx` — split view : liste des steps (✓/→/○/hidden) + renderer de step
- [x] `packages/builder/src/components/Toolbar.tsx` — bouton "▶ Tester" (mode builder) / "← Éditer" (mode preview)
- [x] `packages/builder/src/components/WaypointBuilder.tsx` — state `previewMode`, `previewStoreRef`, layout conditionnel
- Validation inline des champs required, écran "Parcours terminé !", bouton "Recommencer"
- Steps conditionnelles reflétées en temps réel dans le split view

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

### 2.1 — Nouveau Store (`@waypointjs/core`) ✅
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

### 2.3 — WaypointRunner (`@waypointjs/next`) ✅
- [x] `packages/next/src/WaypointRunner.tsx` — Context Provider + init du store
  - Props : `schema`, `externalVars`, `defaultValues`, `fetchData`, `onComplete`, `onStepComplete`, `onDataChange`
  - **Multi-journey** : chaque instance crée son propre store isolé via `useRef` — plusieurs `<WaypointRunner>` peuvent coexister sans interférence
  - **Pause & Resume** : au montage, si `hasPersistedState()` → `resume()` (données + position préservées) ; sinon `init()` + `findLastValidStep` pour deep-link
  - Un parcours `completed` est exclu du resume → redémarre depuis zéro
  - ErrorBoundary explicite si variables bloquantes manquantes
- [x] `packages/next/src/context.ts` — `WaypointRuntimeContext` + `useWaypointRuntimeContext`

---

### 2.4 — Controllers react-hook-form (`@waypointjs/next`) ✅
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

### 2.5 — Navigation avancée (`@waypointjs/next`) ✅
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

### 2.6 — `@waypointjs/devtools` ✅
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

### 2.7 — Responsive Mobile ✅
- [x] `WaypointBuilder` : layout tab-based sur mobile (< 640px) — onglets ⚡ Steps / ⊞ Fields / ⚙ Config en bas de l'écran
- [x] Auto-switch d'onglet : sélection d'un step → Fields, sélection d'un field → Config
- [x] Toolbar mobile : logo masqué, boutons icônes uniquement (`▶ ↓ ↑ ✓ ⟳`) avec tooltip `title`
- [x] `BuilderSection` (landing) : mockup 3 colonnes → empilement vertical sur mobile + MockBtn icon/label
- [x] `ExamplesBar` (demo) : boutons pleine largeur en colonne sur mobile

---

### 2.8 — Tests E2E Runtime ✅
- [x] Navigation linéaire — 3 steps, progress 25/50/75%, validation required, retour, complétion
- [x] Conditions dynamiques — step "Équipe" visible/skippée selon type, progress sur arbre résolu
- [x] Pause & Resume — badge "En cours", lien Reprendre, reset, Recommencer après complétion
- [x] Deep-link → redirect automatique vers la première step sans état
- [x] Fix : labels `<select>` manquaient `htmlFor`/`id` dans `StepRenderer.tsx`
- [x] 31 tests E2E runtime — 31/31 verts en ~20s (`apps/demo/e2e/runtime.spec.ts`)

---

## État des tests

| Package | Tests | Statut |
|---|---|---|
| `@waypointjs/core` | 231 | ✅ tous verts (Phase 1 + 34 runtime-store + 31 zod-generator + 10 inEnum conditions) |
| `@waypointjs/builder` | 50 | ✅ tous verts |
| `apps/demo` (E2E) | 71 | ✅ tous verts (40 builder + 31 runtime) |
| **Total** | **352** | ✅ |

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

## PHASE 3 — Publication ✅ COMPLÈTE

### 3.1 — Publication npm ✅
- [x] `@waypointjs/core` publié sur npm
- [x] `@waypointjs/react` publié sur npm
- [x] `@waypointjs/next` publié sur npm
- [x] `@waypointjs/builder` publié sur npm
- [x] `@waypointjs/devtools` publié sur npm

### 3.2 — Déploiement Vercel ✅
- [x] `apps/docs` — site de documentation déployé sur Vercel
- [x] `apps/demo` — application de démo déployée sur Vercel

---

## Branche git active
`master`

## État global
**Phases 1, 2, 3 complètes ✅**
- 317 tests · 0 échecs
- Packages publiés sur npm · Apps déployées sur Vercel

---

## PHASE 4 — Schema enrichment & Builder UX

### 4.1 — Step skippable
- [ ] Prop `skippable?: true` sur `StepDefinition`
- [ ] Runner : bouton "Passer cette étape" → stocke `{ __skipped: true }` dans les data
- [ ] Builder : toggle "Skippable" dans StepEditor
- [ ] Conditions peuvent référencer `step.skipped`

### 4.2 — Step timeout
- [ ] Prop `timeout?: number` (secondes) sur `StepDefinition`
- [ ] Runner : countdown + redirect automatique à expiration
- [ ] Callback `onStepTimeout?: (stepId) => void` sur WaypointRunner
- [ ] Builder : champ timeout dans StepEditor

### 4.3 — Validation cross-fields / cross-steps
- [ ] Nouveau type de `ValidationRule` : `{ type: "crossField", ref: "stepId.fieldId", operator, message }`
- [ ] `buildZodSchema` supporte `.refine()` avec accès aux data des steps précédentes
- [ ] Builder : ConditionBuilder réutilisé pour définir ces règles

### 4.4 — Valeurs par défaut dynamiques
- [ ] `defaultValue` peut être une `ConditionRule` au lieu d'une valeur statique
- [ ] Ex : `age > 80` → `defaultValue: "retraite"` sur le field `profession`
- [ ] Résolution dans `tree-resolver.ts` à chaque changement de data
- [ ] Builder : UI dédiée dans FieldEditor

### 4.5 — Custom field types (app-provided) ✅
- [x] `CustomTypeDefinition` réutilisé depuis `@waypointjs/core` (id, label, icon?, defaultValidation?, metadata?)
- [x] Prop `appCustomTypes?: CustomTypeDefinition[]` sur `<WaypointBuilder />`
- [x] `BuilderCustomTypesContext` propagé via React context
- [x] `FieldList` : optgroup "Custom" dans le dropdown de type, badge vert pour les custom types, `defaultValidation` appliquée automatiquement au changement de type
- [x] Prop `customFieldTypes?: CustomTypeDefinition[]` sur `<WaypointRunner />`
- [x] Exposé via `WaypointRuntimeContextValue.customFieldTypes` → accessible via `useWaypointRuntimeContext()`

### 4.6 — Enums externes (app-provided) ✅
- [x] `ExternalEnum` : `{ id, label, values: SelectOption[] }` dans `@waypointjs/core`
- [x] `externalEnumId?: string` sur `FieldDefinition` — référence à un enum externe
- [x] `resolvedOptions?: SelectOption[]` sur `ResolvedField` — options résolues par `resolveTree(schema, data, vars, externalEnums)`
- [x] Prop `externalEnums?: ExternalEnum[]` sur `<WaypointBuilder />` — propagée via `BuilderExternalEnumsContext`
- [x] Prop `externalEnums?: ExternalEnum[]` sur `<WaypointRunner />` — transmise à `resolveTree` et au contexte
- [x] `useWaypoint(store, externalEnums?)` headless accepte les enums en 2e param
- [x] Builder : FieldEditor montre un selector "Options source" pour select/multiselect/radio
- [x] Builder : FieldList montre un badge ⊞ quand un enum est référencé
- [x] PreviewPanel résout les options via `resolvedOptions ?? definition.options`
- [x] Opérateurs `inEnum` / `notInEnum` dans `ConditionOperator` — `rule.value` = id de l'enum
- [x] `evaluateConditionGroup` / `isVisible` acceptent `externalEnums?` (4e param) pour résoudre `inEnum`/`notInEnum`
- [x] Opérateurs `inEnum` / `notInEnum` dans `ValidationRuleType` — `rule.value` = id de l'enum
- [x] `buildZodSchema(fields, externalEnums?)` — résout `inEnum`/`notInEnum` via `.refine()`
- [x] 10 nouveaux comparateurs de validation (`equals`, `notEquals`, `greaterThan`, `greaterThanOrEqual`, `lessThan`, `lessThanOrEqual`, `contains`, `notContains`, `matches`, + `inEnum`/`notInEnum`)
- [x] Builder : `ValidationBuilder.tsx` — nouveau composant UI identique au ConditionBuilder (modal pattern pour Validation comme pour Visibility)
- [x] Builder : ConditionBuilder — picket `⊞` enum value + sélecteur d'enum pour `inEnum`/`notInEnum`
- [x] Builder : ValidationBuilder — même comportement que ConditionBuilder pour les enums
- [x] Docs MDX : `core.mdx`, `builder.mdx`, `next.mdx`, `react.mdx` mis à jour
- [x] Skill references : `core.md`, `next.md`, `builder.md` mis à jour
- [x] 35 nouveaux tests unitaires (10 inEnum/notInEnum conditions + 6 isVisible + 19 zod-generator comparateurs)

### 4.7 — Duplicate step / field dans le builder ✅
- [x] Bouton ⧉ sur chaque step card → `duplicateStep()` : clone avec nouveaux IDs, recompose les `dependsOn` intra-step, insère juste après l'originale
- [x] Bouton ⧉ sur chaque field card → `duplicateField()` : clone avec nouvel ID + label "(copy)", insère juste après
- [x] 12 tests unitaires (duplicateStep × 7 + duplicateField × 5)

### 4.8 — Drag & drop dans le builder
- [ ] Drag & drop pour réordonner les steps (colonne 1)
- [ ] Drag & drop pour réordonner les fields (colonne 2)
- [ ] Bibliothèque : `@dnd-kit/core` (support touch/mobile natif)
- [ ] Respecte les contraintes de dépendances (bloqué si move invalide)
- [ ] Fallback ↑↓ conservé pour accessibilité

### 4.9 — Mode read-only / embed du builder ✅
- [x] Prop `readOnly?: boolean` sur `<WaypointBuilder />`
- [x] `BuilderReadOnlyContext` propagé via React context (zero prop-drilling)
- [x] `StepList` / `FieldList` : boutons add/remove/duplicate/reorder masqués
- [x] `StepEditor` : inputs `readOnly`, checkbox `disabled`, boutons condition masqués
- [x] `ExternalVariablePanel` : boutons add/edit/remove masqués
- [x] Toolbar : badge "View only", Import/Save/Reset/Test masqués, Export conservé

### 4.10 — Preview builder avec variables externes mockées ✅
- [x] Section "⚡ External Variables" dans la colonne gauche du PreviewPanel si le schema a des `externalVariables`
- [x] Inputs typés : text, number, checkbox (boolean) — badge `!` sur les vars bloquantes
- [x] Sync immédiate → store (`setExternalVar`) à chaque changement, conditions re-évaluées
- [x] Re-appliqués après "Recommencer" (handleRestart)
- [x] Fix : `handleNext` utilisait maintenant `store.getState().externalVars` (au lieu de `{}`)

---

## PHASE 5 — Developer Experience

### 5.1 — CLI `create-waypoint`
- [ ] `npx create-waypoint` (ou `pnpm create waypoint`)
- [ ] Choix interactif : framework (Next.js / React+Vite), style (Tailwind / CSS Modules / none), TypeScript, inclure le builder
- [ ] Scaffold : dépendances, schema d'exemple, pages, WaypointRunner configuré

### 5.2 — URL params → defaultValues
- [ ] Prop `searchParams?: Record<string, string>` sur `<WaypointRunner />`
- [ ] Mappe automatiquement les query params aux fields du schema au moment de l'`init()`
- [ ] Ex : `/onboarding?name=John&plan=pro` pré-remplit les fields `name` et `plan`

### 5.3 — Analytics hooks
- [ ] Callbacks sur `<WaypointRunner />` : `onStepView`, `onStepSkip`, `onAbandon`
- [ ] `onStepView(stepId, stepIndex, totalSteps)` — déclenché à chaque entrée sur une step
- [ ] `onAbandon(stepId, data)` — déclenché si l'utilisateur quitte sans compléter (via `beforeunload`)
- [ ] Compatible PostHog, Segment, Mixpanel — l'app branche son SDK

### 5.4 — Export JSON depuis le DevTools
- [ ] Bouton "Export schema" dans le DevPanel (`NODE_ENV === "development"` uniquement)
- [ ] Télécharge le schema courant qui tourne dans le runner

### 5.5 — Bundle size
- [ ] Mesure via `bundlephobia` ou `size-limit` pour chaque package
- [ ] Badge dans le README
- [ ] Check en CI pour détecter les régressions

### 5.6 — Vérification standalone `@waypointjs/react`
- [ ] Confirmer que `@waypointjs/react` fonctionne sans Next.js (Vite, CRA, Remix…)
- [ ] Exemple Vite dans `apps/` ou `examples/`
- [ ] Documenter les différences avec `@waypointjs/next`

---

## Hors scope (décisions intentionnelles)
- **Versioning/migration de schemas** — trop proche d'un produit SaaS, hors périmètre du framework
- **Autosave** — `onDataChange` + `persistenceMode: "zustand"` suffisent
- **SDK analytics embarqué** — les hooks (5.3) suffisent, pas de dépendance analytics dans le framework
