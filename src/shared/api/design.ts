import type { JsonSchema } from "@/shared/forms/json-schema";

export type StudyStatus = "queued" | "running" | "done" | "failed" | "cancelled" | "blocked";

export type MissingInput = { path: string; message: string };

export type Study = {
  id: string;
  project: string;
  kind: string;
  name: string;
  settings: Record<string, unknown>;
  status: StudyStatus;
  progress: { done: number; total: number };
  started_by: { kind: "user" | "agent"; name: string; run?: string };
  case_version: number | null;
  plant_version: number | null;
  result: string | null;
  error: { code: string; message: string } | null;
  missing: MissingInput[];
  created: string;
  ended: string | null;
};

export type StudyList = { items: Study[]; next: string | null };

export type StudyKind = {
  kind: string;
  title: string;
  description: string;
  schema: JsonSchema;
};

export type NewStudy = {
  project: string;
  kind: string;
  name: string;
  settings: Record<string, unknown>;
};

export type Kpi = { name: string; title: string; value: number | null; unit: string };

export type ConstraintStatus = "pass" | "fail" | "not_assessed";

export type Constraint = {
  name: string;
  title: string;
  status: ConstraintStatus;
  message: string;
};

export type CoverageDay = { date: string; source: "geothermal" | "backup" | "short" };

export type ResultSummary = {
  id: string;
  name: string;
  study: string;
  case_version: number | null;
  plant_version: number | null;
  kpis: Kpi[];
  checks: { passed: number; failed: number; not_assessed: number };
  created: string;
};

export type ResultDetail = ResultSummary & {
  capacities: Kpi[];
  coverage: CoverageDay[] | null;
  constraints: Constraint[];
  series: unknown[];
};

export type Comparison = { items: ResultSummary[]; pareto: string[] };

export type ReportPart = "capacities" | "design" | "checks" | "costs" | "agentlog";

export type ReportRequest = {
  project: string;
  result: string;
  run?: string;
  include: ReportPart[];
};

export type ReportExportRequest = ReportRequest & { format: "md" | "pdf" };

export type ReportSection = { key: string; title: string; markdown: string };

export type ReportPreview = { title: string; sections: ReportSection[] };
