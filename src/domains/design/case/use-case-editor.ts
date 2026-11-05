import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { isEqualDocument } from "@/shared/forms/document";
import type { Problem } from "@/shared/forms/json-schema";
import { useDebouncedValue } from "@/shared/forms/use-debounced-value";
import { caseValidationQuery } from "./api";
import type { Case, MissingValue } from "@/shared/api/types";
import type { CaseContent } from "./types";

type EditorState = { draft: CaseContent | null; sectionProblems: Record<string, Problem[]> };

const validationDelayMs = 500;

function withSection(content: CaseContent, section: string, value: unknown): CaseContent {
  const others = Object.entries(content).filter(([key]) => key !== section);
  return Object.fromEntries(value === undefined ? others : [...others, [section, value]]);
}

function withPath(target: unknown, keys: string[], value: unknown): unknown {
  const [key, ...rest] = keys;
  if (key === undefined) return value;
  const base: Record<string, unknown> =
    typeof target === "object" && target !== null && !Array.isArray(target)
      ? (target as Record<string, unknown>)
      : {};
  return { ...base, [key]: withPath(base[key], rest, value) };
}

const handSource = { source: "user: set by hand on the Case page" };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function atPath(target: unknown, path: string): unknown {
  return path
    .split(".")
    .reduce<unknown>((node, key) => (isRecord(node) ? node[key] : undefined), target);
}

function withHandSources(saved: unknown, next: unknown): unknown {
  if (!isRecord(next) || !isRecord(next.about) || !isRecord(next.about.sources)) return next;
  const kept = atPath(saved, "about.sources");
  const sources = Object.entries(next.about.sources).flatMap(([key, cited]) => {
    const value = atPath(next, key);
    const before = atPath(saved, key);
    if (value === undefined && before !== undefined) return [];
    if (!isEqualDocument(value, before)) return [[key, handSource]];
    return [[key, (isRecord(kept) ? kept[key] : undefined) ?? cited]];
  });
  return { ...next, about: { ...next.about, sources: Object.fromEntries(sources) } };
}

function prefixed(section: string, problems: Problem[]): Problem[] {
  return problems.map((problem) => ({
    ...problem,
    path: problem.path === "" ? section : `${section}.${problem.path}`,
  }));
}

function isExplained(path: string, serverProblems: Problem[]): boolean {
  return serverProblems.some(
    (problem) => problem.path === path || problem.path.startsWith(`${path}.`),
  );
}

function toProblemList(formProblems: Problem[], serverProblems: Problem[]): Problem[] {
  const shown = formProblems.filter((problem) => !isExplained(problem.path, serverProblems));
  const seen = new Set<string>();
  return [...shown, ...serverProblems].filter((problem) => {
    const key = `${problem.path}:${problem.message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** Holds the draft of a case: dirty state, the debounced server check, and the problems from every section. */
export function useCaseEditor(saved: Case) {
  const [state, setState] = useState<EditorState>({ draft: null, sectionProblems: {} });
  const content = state.draft ?? saved.content;
  const dirty = state.draft !== null && !isEqualDocument(state.draft, saved.content);
  const settled = useDebouncedValue(content, validationDelayMs);
  const checked = useQuery(caseValidationQuery(saved.project, settled, true));
  const server = dirty ? checked.data : saved;
  const formProblems = Object.entries(state.sectionProblems).flatMap(([section, problems]) =>
    prefixed(section, problems),
  );
  const problems = toProblemList(formProblems, server?.problems ?? []);
  const missing: MissingValue[] = server?.missing ?? saved.missing;

  const edit = (section: string, value: unknown, sectionProblems: Problem[]) => {
    setState((previous) => ({
      draft: withSection(
        previous.draft ?? saved.content,
        section,
        withHandSources(saved.content[section], value),
      ),
      sectionProblems: { ...previous.sectionProblems, [section]: sectionProblems },
    }));
  };
  const place = (section: string, path: string, value: unknown) => {
    setState((previous) => {
      const content = previous.draft ?? saved.content;
      const placed = withPath(content[section], path === "" ? [] : path.split("."), value);
      return {
        ...previous,
        draft: withSection(content, section, withHandSources(saved.content[section], placed)),
      };
    });
  };
  const reset = () => {
    setState({ draft: null, sectionProblems: {} });
  };
  const isChecking = dirty && (checked.isFetching || settled !== content);
  const plantMissing: MissingValue[] = checked.data?.plant_missing ?? [];
  const hasPlant = checked.data?.has_plant ?? true;
  const warnings: MissingValue[] = checked.data?.warnings ?? [];
  return {
    content,
    dirty,
    problems,
    missing,
    plantMissing,
    hasPlant,
    warnings,
    isChecking,
    edit,
    place,
    reset,
  };
}
