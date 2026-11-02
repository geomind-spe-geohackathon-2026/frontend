import type {
  Comparison,
  NewStudy,
  ReportExportRequest,
  ReportPreview,
  ReportRequest,
  ResultDetail,
  ResultSummary,
  Study,
  StudyKind,
  StudyList,
} from "./design";

declare module "@/shared/api/schema" {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface paths {
    "/design/study/kinds": {
      get: { responses: { 200: { content: { "application/json": StudyKind[] } } } };
    };
    "/design/study": {
      get: {
        parameters: { query: { project: string; cursor?: string; limit?: number } };
        responses: { 200: { content: { "application/json": StudyList } } };
      };
      post: {
        requestBody: { content: { "application/json": NewStudy } };
        responses: { 201: { content: { "application/json": Study } } };
      };
    };
    "/design/study/{study_id}/start": {
      post: {
        parameters: { path: { study_id: string } };
        responses: { 200: { content: { "application/json": Study } } };
      };
    };
    "/design/study/{study_id}/cancel": {
      post: {
        parameters: { path: { study_id: string } };
        responses: { 200: { content: { "application/json": Study } } };
      };
    };
    "/design/results": {
      get: {
        parameters: { query: { project: string } };
        responses: { 200: { content: { "application/json": ResultSummary[] } } };
      };
    };
    "/design/results/compare": {
      get: {
        parameters: { query: { project: string; ids: string; x: string; y: string } };
        responses: { 200: { content: { "application/json": Comparison } } };
      };
    };
    "/design/results/{result_id}": {
      get: {
        parameters: { path: { result_id: string } };
        responses: { 200: { content: { "application/json": ResultDetail } } };
      };
    };
    "/reporting/design/preview": {
      post: {
        requestBody: { content: { "application/json": ReportRequest } };
        responses: { 200: { content: { "application/json": ReportPreview } } };
      };
    };
    "/reporting/design/export": {
      post: {
        requestBody: { content: { "application/json": ReportExportRequest } };
        responses: { 200: { content: { "application/octet-stream": Blob } } };
      };
    };
  }
}
