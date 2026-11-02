import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

export const root = join(import.meta.dirname, "..", "..");

function walk(folder: string): string[] {
  return readdirSync(folder).flatMap((name) => {
    const path = join(folder, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

/** Lists the project files whose relative path matches the pattern, skipping generated and external folders. */
export function listFiles(folders: string[], pattern: RegExp): string[] {
  return folders
    .flatMap((folder) => walk(join(root, folder)))
    .map((file) => relative(root, file))
    .filter((file) => pattern.test(file) && !file.endsWith("schema.d.ts"));
}

/** Reads a project file as text. */
export function toText(file: string): string {
  return readFileSync(join(root, file), "utf8");
}
