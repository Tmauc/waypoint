/**
 * A single step within a journey tree category.
 */
export interface JourneyTreeStep {
  /**
   * When true, automatically enables canResumeToDeepestStep when this step is reached.
   */
  enableResumeFromHere?: boolean;
  /** Unique step identifier */
  step: string;
  /** URL template — supports {{PARAM}} placeholders */
  url: string;
}

/** A logical grouping of steps */
interface JourneyTreeCategory {
  category: string;
  steps: JourneyTreeStep[];
}

/** The full navigation tree for a journey, ordered list of categories */
export type JourneyTreeType = JourneyTreeCategory[];

/** Generic URL parameters map — keys are placeholder names, values are strings or numbers */
export type WaypointParams = Record<string, string | number | undefined>;

/** Runtime state for a single journey */
export interface JourneyState {
  canResumeToDeepestStep: boolean;
  currentStep: string | null;
  deepestStepVisited: string;
  history: string[];
  progress: number;
  tree: JourneyTreeType;
}
