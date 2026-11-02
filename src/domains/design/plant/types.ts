import type { JsonSchema, Problem } from "@/shared/forms/json-schema";

export type PlantSpec = Record<string, unknown>;
export type Layout = Record<string, { x: number; y: number }>;
export type FlowModule = { id: string; type: string; title: string; category: string };
export type FlowConnection = {
  source: string;
  target: string;
  stream: string;
  kind: string | null;
};
export type Flowsheet = {
  project: string;
  version: number;
  spec: PlantSpec;
  layout: Layout;
  modules: FlowModule[];
  connections: FlowConnection[];
};
export type PaletteItem = { type: string; title: string; category: string; summary: string };
export type Template = { name: string; title: string; description: string; purpose: string | null };
export type PlantVersion = {
  number: number;
  note: string;
  author: { id: string; name: string };
  created: string;
};
export type Parameters = {
  module: string;
  type: string;
  schema: JsonSchema;
  values: Record<string, unknown>;
  missing: string[];
  history: { valid_from: string; params: Record<string, unknown> }[];
};
export type PlantProblem = Problem & { code: string };
export type SaveFlowsheetInput =
  | { base: number | null; note: string; spec: PlantSpec; layout: Layout }
  | { base: number | null; note: string; template: string };
export type SaveParametersInput = {
  base: number;
  module: string;
  params: Record<string, unknown>;
  note: string;
};

type Json<T> = { content: { "application/json": T } };

declare module "@/shared/api/schema" {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface paths {
    "/plant/flowsheet/palette": { get: { responses: { 200: Json<PaletteItem[]> } } };
    "/plant/flowsheet/templates": { get: { responses: { 200: Json<Template[]> } } };
    "/plant/flowsheet": {
      get: { parameters: { query: { project: string } }; responses: { 200: Json<Flowsheet> } };
      post: {
        requestBody: {
          content: { "application/json": { project: string } & SaveFlowsheetInput };
        };
        responses: { 201: Json<Flowsheet> };
      };
    };
    "/plant/flowsheet/layout": {
      put: {
        requestBody: {
          content: { "application/json": { project: string; base: number; layout: Layout } };
        };
        responses: { 200: Json<Flowsheet> };
      };
    };
    "/plant/flowsheet/validate": {
      post: {
        requestBody: { content: { "application/json": { spec: PlantSpec } } };
        responses: { 200: Json<{ problems: PlantProblem[] }> };
      };
    };
    "/plant/flowsheet/versions": {
      get: {
        parameters: { query: { project: string } };
        responses: { 200: Json<PlantVersion[]> };
      };
    };
    "/plant/flowsheet/versions/{number}": {
      get: {
        parameters: { path: { number: number }; query: { project: string } };
        responses: { 200: Json<Flowsheet> };
      };
    };
    "/plant/parameters": {
      get: {
        parameters: { query: { project: string; module: string } };
        responses: { 200: Json<Parameters> };
      };
      post: {
        requestBody: {
          content: { "application/json": { project: string } & SaveParametersInput };
        };
        responses: { 201: Json<PlantVersion> };
      };
    };
  }
}
