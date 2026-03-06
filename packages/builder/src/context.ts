import { createContext, useContext } from "react";
import type { CustomTypeDefinition, ExternalEnum } from "@waypointjs/core";

export const BuilderReadOnlyContext = createContext(false);

export function useBuilderReadOnly(): boolean {
  return useContext(BuilderReadOnlyContext);
}

export const BuilderCustomTypesContext = createContext<CustomTypeDefinition[]>([]);

export function useBuilderCustomTypes(): CustomTypeDefinition[] {
  return useContext(BuilderCustomTypesContext);
}

export const BuilderExternalEnumsContext = createContext<ExternalEnum[]>([]);

export function useBuilderExternalEnums(): ExternalEnum[] {
  return useContext(BuilderExternalEnumsContext);
}
