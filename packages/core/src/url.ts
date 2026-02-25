import type { WaypointParams } from "./types";

interface StepDefinition {
  step: string;
  url: string;
}

/**
 * Utility class for URL template formatting and validation.
 * Templates use `{{PARAM_NAME}}` syntax.
 *
 * @example
 * URLTemplateEngine.format("/users/{{USER_ID}}/posts/{{POST_ID}}", { USER_ID: "42", POST_ID: "hello" })
 * // => "/users/42/posts/hello"
 */
export class URLTemplateEngine {
  private static readonly PLACEHOLDER_PATTERN = /\{\{([^}]+)\}\}/g;

  /**
   * Replace all `{{PARAM}}` placeholders in a template with the provided values.
   * Missing params are left as-is.
   */
  static format(template: string, params: WaypointParams): string {
    return template.replace(this.PLACEHOLDER_PATTERN, (match, key) => {
      const value = params[key];
      if (value === undefined || value === null) {
        console.log(`Waypoint: missing parameter "${key}" in URL: ${template}`);
        return match;
      }
      return String(value);
    });
  }

  /**
   * Extract all placeholder names from a URL template.
   */
  static extractPlaceholders(template: string): string[] {
    const matches = template.match(this.PLACEHOLDER_PATTERN);
    return matches ? matches.map((m) => m.replace(/[{}]/g, "")) : [];
  }

  /**
   * Validate that all placeholders in the template have corresponding params.
   */
  static validate(
    template: string,
    params: WaypointParams
  ): { isValid: boolean; missingParams: string[] } {
    const placeholders = this.extractPlaceholders(template);
    const missingParams = placeholders.filter((key) => params[key] === undefined);
    return { isValid: missingParams.length === 0, missingParams };
  }
}

// ── Private URL matching helpers (used by hooks) ──────────────────────────────

function doesPatternMatchURL(pathname: string, urlPattern: string): boolean {
  const regexPattern = urlPattern
    .replace(/\{\{([^}]+)\}\}/g, "([^/]+)")
    .replace(/\//g, "\\/");
  return new RegExp(`^${regexPattern}$`).test(pathname);
}

function doesPatternPartiallyMatch(
  pathname: string,
  urlPattern: string
): boolean {
  const patternBase = urlPattern
    .replace(/\{\{[^}]+\}\}/g, "*")
    .split("/")
    .filter((segment) => segment !== "*" && segment !== "");

  const pathSegments = pathname.split("/").filter((s) => s !== "");

  let patternIndex = 0;
  for (const seg of pathSegments) {
    if (
      patternIndex < patternBase.length &&
      seg === patternBase[patternIndex]
    ) {
      patternIndex++;
    }
  }
  return patternIndex === patternBase.length;
}

function extractParamsFromPattern(
  pathname: string,
  urlPattern: string
): WaypointParams {
  const params: WaypointParams = {};
  const placeholders: string[] = [];

  const regexPattern = urlPattern.replace(
    /\{\{([^}]+)\}\}/g,
    (_match, paramName) => {
      placeholders.push(paramName);
      return "([^/]+)";
    }
  );

  const regex = new RegExp(`^${regexPattern.replace(/\//g, "\\/")}$`);
  const matches = pathname.match(regex);

  if (matches) {
    for (let i = 1; i < matches.length; i++) {
      const paramName = placeholders[i - 1];
      const paramValue = matches[i];
      if (paramName.includes("_ID") && /^\d+$/.test(paramValue)) {
        params[paramName] = parseInt(paramValue, 10);
      } else {
        params[paramName] = paramValue;
      }
    }
  }

  return params;
}

export function findMatchingStep(
  pathname: string,
  allSteps: StepDefinition[]
): StepDefinition | null {
  for (const step of allSteps) {
    if (doesPatternMatchURL(pathname, step.url)) return step;
  }
  for (const step of allSteps) {
    if (doesPatternPartiallyMatch(pathname, step.url)) return step;
  }
  return null;
}

export function extractURLParamsFromTree(
  pathname: string,
  allSteps: StepDefinition[]
): WaypointParams {
  const matching = findMatchingStep(pathname, allSteps);
  if (!matching) return {};
  return extractParamsFromPattern(pathname, matching.url);
}

export function extractOnlyMissingParams(
  pathname: string,
  allSteps: StepDefinition[],
  missingParamNames: string[]
): WaypointParams {
  if (missingParamNames.length === 0) return {};
  const matching = findMatchingStep(pathname, allSteps);
  if (!matching) return {};

  const all = extractParamsFromPattern(pathname, matching.url);
  const filtered: WaypointParams = {};
  for (const name of missingParamNames) {
    if (all[name] !== undefined) filtered[name] = all[name];
  }
  return filtered;
}

export function mergeContextParams(
  userParams: WaypointParams = {},
  pathname: string,
  allSteps: StepDefinition[],
  targetURL?: string
): WaypointParams {
  let urlParams: WaypointParams = {};
  if (targetURL) {
    const required = URLTemplateEngine.extractPlaceholders(targetURL);
    const missing = required.filter((p) => userParams[p] === undefined);
    urlParams = extractOnlyMissingParams(pathname, allSteps, missing);
  } else {
    urlParams = extractURLParamsFromTree(pathname, allSteps);
  }
  return { ...urlParams, ...userParams };
}
