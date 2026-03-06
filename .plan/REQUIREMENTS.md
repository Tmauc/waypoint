# Waypoint — Requirements complets (issus du Q&A)

## 1. Gestion des données

### Données liées aux validations, pas aux URLs
- Les données ne sont pas liées aux URLs, elles sont liées à des règles de dépendance
- Exemple : `age` (step 1) est requis pour calculer `niveau_etude` (step 3)
- La step 3 est inaccessible si `age` n'est pas défini, peu importe où `age` a été collecté

### Store accessible à tout moment
- Le store Waypoint est accessible via hook depuis n'importe quel composant
- Utile pour afficher des infos conditionnelles hors du form (bannière, sidebar, etc.)
- Callback `onComplete(data)` à la fin du parcours avec toutes les données consolidées

### Données temporaires (tmp)
- Quand une step conditionnelle disparaît (condition devient fausse), ses données sont mises en "tmp"
- Les données tmp ne participent plus aux conditions, règles, validations
- Si la condition redevient vraie, les données tmp sont réinjectées

## 2. Navigation

### URL-first conservé
- Chaque step = une vraie URL Next.js (pages réelles, pas de rendu interne)
- Back-button natif, deep-linking, resume via URL conservés
- Waypoint gère la navigation (goNext, goBack) et l'état d'avancement

### Deep-link & resume
- Si un utilisateur arrive en deep-link sur une step sans avoir rempli les précédentes :
  Waypoint calcule automatiquement jusqu'où les données ont été remplies
  et redirige vers la dernière step valide

### Conditions d'ordre dans l'arbre
- L'arbre se recalcule dynamiquement au runtime si les conditions changent
- Exemple : `age` passe de 20 à 16 → step conditionnelle disparaît → progression réajustée
- Les steps conditionnelles peuvent s'insérer entre des steps existantes dynamiquement

## 3. Builder no-code (`@waypointjs/builder`)

### Composant React embeddable
- Un `<WaypointBuilder />` intégrable dans n'importe quelle app Next.js
- UI par défaut fournie, mais stylisable/themable pour s'intégrer partout

### Fonctionnalités du builder
- Créer/supprimer des steps
- Créer/supprimer des champs dans chaque step (type, label, validation)
- Ajouter des règles de dépendance entre champs et entre steps
- Ajouter des conditions de visibilité (champ ou step) basées sur des valeurs
- Déclarer des variables externes bloquantes (avec leur impact sur l'arbre)
- Enregistrer des types de champs custom (configurables dans le builder)
- Les types custom sont exportés dans le JSON pour que le backend puisse les enrichir

### JSON généré
- Auto-suffisant : contient steps, champs, types, règles, validations, conditions, variables externes
- Versionné : `"version": "1.0"` dès le début pour évolutions non-breaking
- Exportable / importable
- Sauvegardable en backend (le builder envoie/reçoit le JSON d'un endpoint)

### Conditions supportées dans le builder
- Conditions de visibilité d'un champ dans une step (`age > 18` → afficher champ `permis`)
- Conditions de visibilité d'une step dans l'arbre (si `age > 18` → insérer step entre S3 et S4)
- Conditions basées sur les données du parcours ET sur des variables externes
- Opérateurs : equals, notEquals, greaterThan, lessThan, contains, in, exists, etc.

### Validation dans le builder
- Délégué à Zod + react-hook-form (Waypoint ne fournit pas ses propres validators)
- Le builder permet de définir les règles de validation (required, min, max, email, regex…)
- Ces règles sont encodées dans le JSON et interprétées au runtime via Zod

## 4. Runtime (`@waypointjs/next`)

### WaypointRunner (à créer)
- Composant principal qui initialise le parcours à partir d'un JSON
- Gère l'état d'avancement, les conditions dynamiques, les données
- Le dev reste responsable de ses pages Next.js — Waypoint ne rend pas les steps

### Controllers react-hook-form
- Sur chaque page, Waypoint expose les controllers pour les champs de la step courante
- Waypoint gère le handleSubmit (validation + stockage + goNext automatique)
- Waypoint expose `isSubmitting` (boolean) — le dev gère son propre UI de loading

### Variables externes
- Déclarées dans le JSON du builder
- Injectables à l'initialisation ou pendant le parcours
- Doivent être fournies AVANT la première step qui en a besoin
- Si non fournies : blocage + erreur explicite (pas de redirect automatique)

### Sélection de version (A/B testing)
- Le JSON est versionné, plusieurs versions peuvent coexister
- Au moment du `<WaypointRunner />`, le dev peut choisir une version (dernière par défaut)
- L'assignation de version est gérée côté dev/backend — Waypoint reçoit juste la version

## 5. Persistance des données

### Mode 1 : Store Zustand (local)
- Données persistées dans Zustand (avec persist middleware)
- Par défaut pour les parcours sans besoin de sauvegarde serveur

### Mode 2 : Backend step-by-step
- `onStepComplete: async (stepId, data) => void` — Waypoint bloque la navigation jusqu'à résolution
- OU hook/event exposé — le dev contrôle manuellement quand débloquer
- Les deux modes coexistent, configurables par parcours

### Callback bidirectionnelle
- `onDataChange: (data) => void` — appelé à chaque changement de données (sync vers backend)
- `fetchData: async () => data` — appelé par Waypoint quand il a besoin de récupérer des données persistées (ex: deep-link)

## 6. Packages cibles

| Package | Statut | Description |
|---|---|---|
| `@waypointjs/core` | Existant — à étendre | Store, URL engine, types |
| `@waypointjs/react` | Supprimé (phase 1) | Remplacé par next |
| `@waypointjs/next` | Existant — à étendre | Runtime Next.js, Runner, controllers |
| `@waypointjs/builder` | À créer (Phase 1) | Builder no-code embeddable |
| `@waypointjs/devtools` | À créer (Phase 2) | Panel debug dev-only |

## 7. Tests

- **Unitaires (Vitest)** : logique core, évaluation des conditions, calcul de progression, merge de données, résolution d'ordre de l'arbre
- **E2E (Playwright)** : builder (interactions UI, export JSON), runtime (navigation, validation, deep-link, conditions dynamiques)
- Système de test rodé dès le début, pas en fin de projet

## 8. En attente (hors scope Phase 1 & 2)

- Package backend step-by-step (le backend connaît tout l'arbre mais ne fournit qu'une step simplifiée à la fois)
