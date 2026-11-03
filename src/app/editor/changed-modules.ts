import type { Flowsheet } from "@/shared/api/types";
import { isRecord } from "@/shared/forms/json-schema";

function moduleOf(end: string): string {
  return end.split(".")[0] ?? end;
}

function paramsOf(sheet: Flowsheet, id: string): string {
  const params = sheet.spec.params;
  return JSON.stringify(isRecord(params) ? (params[id] ?? null) : null);
}

function connectionKeys(sheet: Flowsheet): Set<string> {
  return new Set(sheet.connections.map((line) => `${line.source}>${line.target}`));
}

/** The modules of `after` that are new, changed type or parameters, or gained or lost a connection since `before`. */
export function toChangedModules(before: Flowsheet, after: Flowsheet): Set<string> {
  const changed = new Set<string>();
  const old = new Map(before.modules.map((module) => [module.id, module.type]));
  for (const module of after.modules) {
    const type = old.get(module.id);
    if (type !== module.type || paramsOf(before, module.id) !== paramsOf(after, module.id)) {
      changed.add(module.id);
    }
  }
  const was = connectionKeys(before);
  const now = connectionKeys(after);
  const moved = [...now]
    .filter((key) => !was.has(key))
    .concat([...was].filter((key) => !now.has(key)));
  const ids = new Set(after.modules.map((module) => module.id));
  for (const key of moved) {
    for (const end of key.split(">")) if (ids.has(moduleOf(end))) changed.add(moduleOf(end));
  }
  return changed;
}
