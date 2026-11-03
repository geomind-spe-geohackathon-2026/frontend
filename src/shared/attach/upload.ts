import { api, toData, toFormData } from "@/shared/api/client";

const pollingMs = 1500;
const pollingTries = 20;

function pause(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function toReadState(projectId: string, documentId: string): Promise<string | undefined> {
  const page = toData(
    await api.GET("/workspace/documents", { params: { query: { project: projectId } } }),
  );
  return page.items.find((item) => item.id === documentId)?.searchable;
}

/** Uploads a file to the project's documents and waits until the assistant can read it. */
export async function toReadDocument(projectId: string, file: File): Promise<void> {
  const document = toData(
    await api.POST("/workspace/documents", {
      body: { project: projectId, file },
      bodySerializer: toFormData,
    }),
  );
  let state: string | undefined = document.searchable;
  for (let attempt = 0; state === "pending" && attempt < pollingTries; attempt += 1) {
    await pause(pollingMs);
    state = await toReadState(projectId, document.id);
  }
  if (state === "failed") throw new Error("The assistant cannot read this file");
}

/** Adds the names of the attached files to a message, so the assistant knows what to look at. */
export function toMessageWithFiles(content: string, names: string[]): string {
  return names.length === 0 ? content : `${content}\n\nAttached files: ${names.join(", ")}`;
}

/** Uploads a file to the project's documents without waiting for the assistant to read it. */
export async function uploadDocument(projectId: string, file: File): Promise<void> {
  toData(
    await api.POST("/workspace/documents", {
      body: { project: projectId, file },
      bodySerializer: toFormData,
    }),
  );
}
