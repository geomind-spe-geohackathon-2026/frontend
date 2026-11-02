import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { isEqualDocument } from "@/shared/forms/document";
import type { Problem } from "@/shared/forms/json-schema";
import { useDebouncedValue } from "@/shared/forms/use-debounced-value";
import { caseValidationQuery } from "./api";
import type { Case, CaseContent, MissingValue } from "./types";

type EditorState = { draft: CaseContent | null; sectionProblems: Record<string, Problem[]> };

const validationDelayMs = 500;

function withSection(content: CaseContent, section: string, value: unknown): CaseContent {
  const others = Object.entries(content).filter(([key]) => key !== section);
  return Object.fromEntries(value === undefined ? others : [...others, [section, value]]);
}

function prefixed(section: string, problems: Problem[]): Problem[] {
  return problems.map((problem) => ({
    ...problem,
    path: problem.path === "" ? section : `${section}.${problem.path}`,
  }));
}

/** Holds the draft of a case: dirty state, the debounced server check, and the problems from every section. */
export function useCaseEditor(saved: Case) {
  const [state, setState] = useState<EditorState>({ draft: null, sectionProblems: {} });
  const content = state.draft ?? saved.content;
  const dirty = state.draft !== null && !isEqualDocument(state.draft, saved.content);
  const settled = useDebouncedValue(content, validationDelayMs);
  const checked = useQuery(caseValidationQuery(settled, dirty));
  const server = dirty ? checked.data : saved;
  const formProblems = Object.entries(state.sectionProblems).flatMap(([section, problems]) =>
    prefixed(section, problems),
  );
  const problems: Problem[] = [...formProblems, ...(server?.problems ?? [])];
  const missing: MissingValue[] = server?.missing ?? saved.missing;

  const edit = (section: string, value: unknown, sectionProblems: Problem[]) => {
    setState((previous) => ({
      draft: withSection(previous.draft ?? saved.content, section, value),
      sectionProblems: { ...previous.sectionProblems, [section]: sectionProblems },
    }));
  };
  const reset = () => {
    setState({ draft: null, sectionProblems: {} });
  };
  const isChecking = dirty && (checked.isFetching || settled !== content);
  return { content, dirty, problems, missing, isChecking, edit, reset };
}
