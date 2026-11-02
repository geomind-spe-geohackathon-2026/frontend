import type { Case, CaseCreate } from "@/shared/api/types";

export type CaseContent = Case["content"];
export type SaveCaseInput = Omit<CaseCreate, "project">;
export type UploadInput = { base: number | null; name: string; file: Blob };
