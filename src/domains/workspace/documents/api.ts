import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, toData, toFormData } from "@/shared/api/client";
import { pagedQuery } from "@/shared/api/pagination";

export const documentKeys = {
  all: (projectId: string) => ["projects", projectId, "documents"] as const,
};

const pollingMs = 2000;

/** Paged query options for the project documents; polls while a document is still being indexed. */
export const documentsQuery = (projectId: string) => ({
  ...pagedQuery(documentKeys.all(projectId), async (cursor, signal) =>
    toData(
      await api.GET("/workspace/documents", {
        params: { query: { project: projectId, ...(cursor === null ? {} : { cursor }) } },
        signal,
      }),
    ),
  ),
  refetchInterval: (query: {
    state: { data: { pages: { items: { searchable: string }[] }[] } | undefined };
  }) => {
    const pages = query.state.data?.pages ?? [];
    const pending = pages.some((page) => page.items.some((item) => item.searchable === "pending"));
    return pending ? pollingMs : false;
  },
});

/** Mutation that uploads one file to the project and refreshes the list. */
export function useUploadDocument(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      return toData(
        await api.POST("/workspace/documents", {
          body: { project: projectId, file },
          bodySerializer: toFormData,
        }),
      );
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: documentKeys.all(projectId) }),
  });
}

/** Mutation that deletes one document and refreshes the list. */
export function useDeleteDocument(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (documentId: string) => {
      await api.DELETE("/workspace/documents/{document_id}", {
        params: { path: { document_id: documentId } },
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: documentKeys.all(projectId) }),
  });
}
