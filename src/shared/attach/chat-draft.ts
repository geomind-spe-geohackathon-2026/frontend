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

/** Forgets the kept message of a project once it is sent. */
export function clearDraft(projectId: string): void {
  try {
    sessionStorage.removeItem(`${prefix}${projectId}`);
  } catch {
    return;
  }
}
