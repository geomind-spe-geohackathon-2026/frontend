const prefix = "geomind.draft.";

/** Keeps a message for the first chat of a project; the user still sends it. */
export function keepDraft(projectId: string, text: string): void {
  try {
    if (text.trim() === "") return;
    sessionStorage.setItem(`${prefix}${projectId}`, text.trim());
  } catch {
    return;
  }
}

/** The kept message of a project, or an empty text. */
export function readDraft(projectId: string): string {
  try {
    return sessionStorage.getItem(`${prefix}${projectId}`) ?? "";
  } catch {
    return "";
  }
}

const filesPrefix = "geomind.draft-files.";

/** Keeps the names of files already in the Library for the first chat message of a project. */
export function keepDraftFiles(projectId: string, names: string[]): void {
  try {
    if (names.length === 0) return;
    sessionStorage.setItem(`${filesPrefix}${projectId}`, JSON.stringify(names));
  } catch {
    return;
  }
}

/** The kept file names of a project's first message, or none. */
export function readDraftFiles(projectId: string): string[] {
  try {
    const value: unknown = JSON.parse(sessionStorage.getItem(`${filesPrefix}${projectId}`) ?? "[]");
    return Array.isArray(value) ? value.filter((name) => typeof name === "string") : [];
  } catch {
    return [];
  }
}

/** Forgets the kept files of a project once they are sent. */
export function clearDraftFiles(projectId: string): void {
  try {
    sessionStorage.removeItem(`${filesPrefix}${projectId}`);
  } catch {
    return;
  }
}

/** Forgets the kept message and files of a project once it is sent. */
export function clearDraft(projectId: string): void {
  try {
    sessionStorage.removeItem(`${filesPrefix}${projectId}`);
    sessionStorage.removeItem(`${prefix}${projectId}`);
  } catch {
    return;
  }
}
