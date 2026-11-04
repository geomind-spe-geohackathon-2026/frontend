import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { readDraftFiles } from "./chat-draft";
import { toReadDocument } from "./upload";

export type Attachment = {
  name: string;
  state: "reading" | "ready" | "failed";
  message: string | null;
};

/** The files attached to a message that is being written, uploaded as project documents. */
export function useAttachments(projectId: string) {
  const queryClient = useQueryClient();
  const [items, setItems] = useState<Attachment[]>(() =>
    readDraftFiles(projectId).map((name) => ({ name, state: "ready", message: null })),
  );

  function update(name: string, change: Partial<Attachment>): void {
    setItems((current) =>
      current.map((item) => (item.name === name ? { ...item, ...change } : item)),
    );
  }

  async function read(file: File): Promise<void> {
    try {
      await toReadDocument(projectId, file);
      update(file.name, { state: "ready" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "The upload failed";
      update(file.name, { state: "failed", message });
    }
    await queryClient.invalidateQueries({ queryKey: ["projects", projectId, "documents"] });
  }

  function add(files: File[]): void {
    const known = new Set(items.map((item) => item.name));
    const fresh = files.filter((file) => !known.has(file.name));
    setItems((current) => [
      ...current,
      ...fresh.map((file) => ({
        name: file.name,
        state: "reading" as const,
        message: null,
      })),
    ]);
    fresh.forEach((file) => void read(file));
  }

  return {
    items,
    add,
    remove: (name: string) => {
      setItems((current) => current.filter((item) => item.name !== name));
    },
    clear: () => {
      setItems([]);
    },
    reading: items.some((item) => item.state === "reading"),
    names: items.filter((item) => item.state === "ready").map((item) => item.name),
  };
}
