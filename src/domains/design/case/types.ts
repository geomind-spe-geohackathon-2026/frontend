import type { JsonSchema, Problem } from "@/shared/forms/json-schema";

/** The case document as gemini writes it; routes below merge into the hand-kept paths interface until gen:api runs. */
export type CaseContent = Record<string, unknown>;
export type MissingValue = { path: string; message: string };
export type CaseFile = { name: string; size: number };
export type Case = {
  project: string;
  version: number;
  content: CaseContent;
  files: CaseFile[];
  missing: MissingValue[];
  problems: Problem[];
};
export type Validation = { missing: MissingValue[]; problems: Problem[] };
export type CaseVersion = {
  number: number;
  note: string;
  author: { id: string; name: string };
  created: string;
};
export type SeriesPoints = { name: string; unit: string; points: (string | number)[][] };
export type SaveCaseInput = { base: number | null; note: string; content: CaseContent };
export type UploadInput = { base: number | null; name: string; file: Blob };

type Json<T> = { content: { "application/json": T } };

declare module "@/shared/api/schema" {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface paths {
    "/design/case": {
      get: { parameters: { query: { project: string } }; responses: { 200: Json<Case> } };
      post: {
        requestBody: {
          content: {
            "application/json": {
              project: string;
              base: number | null;
              note: string;
              content: CaseContent;
            };
          };
        };
        responses: { 201: Json<Case> };
      };
    };
    "/design/case/schema": { get: { responses: { 200: Json<JsonSchema> } } };
    "/design/case/validate": {
      post: {
        requestBody: { content: { "application/json": { content: CaseContent } } };
        responses: { 200: Json<Validation> };
      };
    };
    "/design/case/files": {
      post: {
        requestBody: {
          content: {
            "multipart/form-data": {
              project: string;
              base: number | null;
              name: string;
              file: Blob;
            };
          };
        };
        responses: { 201: Json<Case> };
      };
    };
    "/design/case/series": {
      get: {
        parameters: { query: { project: string } };
        responses: { 200: Json<{ series: SeriesPoints[] }> };
      };
    };
    "/design/case/versions": {
      get: {
        parameters: { query: { project: string } };
        responses: { 200: Json<CaseVersion[]> };
      };
    };
  }
}
