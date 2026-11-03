import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, toData, toFormData } from "@/shared/api/client";
import { toAllItems } from "@/shared/api/pagination";
import type { ExperienceEntry, KnowledgeCreate, KnowledgeEntry } from "@/shared/api/pending";

export type Section = "knowledge" | "experience";

export const knowledgeKeys = {
  all: ["knowledge"] as const,
  section: (section: Section, q: string) => ["knowledge", section, q] as const,
};

/** Query options for every entry of one memory section that matches the words. */
export const knowledgeQuery = (section: Section, q: string) =>
  queryOptions({
    queryKey: knowledgeKeys.section(section, q),
    queryFn: ({ signal }) =>
      toAllItems(async (cursor) =>
        toData(
          await api.GET("/workspace/knowledge", {
            params: {
              query: {
                section,
                ...(q === "" ? {} : { q }),
                ...(cursor === undefined ? {} : { cursor }),
              },
            },
            signal,
          }),
        ),
      ),
  });

/** Tells a knowledge entry from an experience entry. */
export function isKnowledge(entry: KnowledgeEntry | ExperienceEntry): entry is KnowledgeEntry {
  return "item" in entry;
}

/** Mutation that adds one cited value to the knowledge. */
export function useAddKnowledge() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (entry: KnowledgeCreate) =>
      toData(await api.POST("/workspace/knowledge", { body: entry })),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: knowledgeKeys.all }),
  });
}

/** Mutation that loads a cited catalogue (CSV) into the knowledge. */
export function useImportKnowledge() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) =>
      toData(
        await api.POST("/workspace/knowledge/import", {
          body: { file },
          bodySerializer: toFormData,
        }),
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: knowledgeKeys.all }),
  });
}

/** Mutation that deletes one entry of a section. */
export function useDeleteKnowledge(section: Section) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (entryId: string) => {
      await api.DELETE("/workspace/knowledge/{section}/{entry_id}", {
        params: { path: { section, entry_id: entryId } },
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: knowledgeKeys.all }),
  });
}
