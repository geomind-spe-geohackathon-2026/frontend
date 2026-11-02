import { createContext, useContext } from "react";
import type { Problem } from "./json-schema";

export type SeriesSource = {
  scope: string;
  files: string[];
  time: unknown;
  uploadBlocked: boolean;
  read: (file: string) => Promise<string>;
  upload: (file: File, field: string) => void;
  takePicked: (field: string) => string | undefined;
};

export type FieldContext = {
  prefix: string;
  missing: readonly string[];
  problems: readonly Problem[];
  series?: SeriesSource | undefined;
  describeItem?: ((item: unknown) => string | null) | undefined;
  hints?: Record<string, string> | undefined;
  hideRange?: boolean | undefined;
};

export const fieldContext = createContext<FieldContext>({ prefix: "", missing: [], problems: [] });

/** Reads the document prefix, server missing paths and server problems of the enclosing form. */
export function useFieldContext(): FieldContext {
  return useContext(fieldContext);
}

/** Joins a document prefix and a local dotted path. */
export function toFullPath(prefix: string, path: string): string {
  if (prefix === "") return path;
  return path === "" ? prefix : `${prefix}.${path}`;
}

/** Makes the element id of a field from its full document path. */
export function toFieldId(fullPath: string): string {
  return `field-${fullPath}`;
}

/** Appends a key or list index to a local dotted path. */
export function toChildPath(path: string, key: string): string {
  return path === "" ? key : `${path}.${key}`;
}
