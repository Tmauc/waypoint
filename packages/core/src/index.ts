// ---------------------------------------------------------------------------
// Schema types
// ---------------------------------------------------------------------------
export type {
  BuiltinFieldType,
  ConditionGroup,
  ConditionOperator,
  ConditionRule,
  CustomTypeDefinition,
  ExternalEnum,
  ExternalVariable,
  FieldDefinition,
  FieldType,
  PersistenceMode,
  SelectOption,
  StepDefinition,
  ValidationRule,
  ValidationRuleType,
  WaypointSchema,
} from "./schema";

// ---------------------------------------------------------------------------
// Condition engine
// ---------------------------------------------------------------------------
export {
  evaluateConditionGroup,
  isVisible,
  resolveFieldValue,
} from "./conditions";
export type { ExternalVars, JourneyData } from "./conditions";

// ---------------------------------------------------------------------------
// Tree resolver
// ---------------------------------------------------------------------------
export {
  calculateProgress,
  findLastValidStep,
  findStepIndex,
  getNextStep,
  getPreviousStep,
  resolveTree,
} from "./tree-resolver";
export type { ResolvedField, ResolvedStep, ResolvedTree } from "./tree-resolver";

// ---------------------------------------------------------------------------
// Runtime store (Phase 2)
// ---------------------------------------------------------------------------
export {
  createRuntimeStore,
  hasPersistedState,
  calculateProgressFromState,
  getCurrentStep,
  getMissingBlockingVars,
  getNextStepFromState,
  getPreviousStepFromState,
  getResolvedTree,
} from "./runtime-store";
export type {
  CreateRuntimeStoreOptions,
  RuntimeStore,
  WaypointRuntimeActions,
  WaypointRuntimeState,
  WaypointRuntimeStore,
} from "./runtime-store";

// ---------------------------------------------------------------------------
// Zod schema generator (Phase 2)
// ---------------------------------------------------------------------------
export { buildZodSchema, registerCustomValidator } from "./zod-generator";

// ---------------------------------------------------------------------------
// Schema validation
// ---------------------------------------------------------------------------
export { assertSchema, validateSchema } from "./validate-schema";
export type { SchemaValidationResult } from "./validate-schema";

// ---------------------------------------------------------------------------
// URL utilities
// ---------------------------------------------------------------------------
export {
  URLTemplateEngine,
  extractURLParamsFromTree,
  extractOnlyMissingParams,
  findMatchingStep,
  mergeContextParams,
} from "./url";

// ---------------------------------------------------------------------------
// Legacy types (kept for backward compatibility — may be removed in v2)
// ---------------------------------------------------------------------------
export type {
  JourneyState,
  JourneyTreeStep,
  JourneyTreeType,
  WaypointParams,
} from "./types";
