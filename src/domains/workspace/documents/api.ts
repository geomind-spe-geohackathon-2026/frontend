import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, toData, toFormData } from "@/shared/api/client";
import { pagedQuery } from "@/shared/api/pagination";

/** A project id for its Library, or null for the shared Knowledge. */
export type Scope = string | null;

export const documentKeys = {
  all: (scope: Scope) =>
    scope === null
      ? (["knowledge", "documents"] as const)
      : (["projects", scope, "documents"] as const),
};

function toProject(scope: Scope): { project?: string } {
  return scope === null ? {} : { project: scope };
}

const pollingMs = 2000;

/** Paged query options for the project documents; polls while a document is still being indexed. */
export const documentsQuery = (scope: Scope) => ({
  ...pagedQuery(documentKeys.all(scope), async (cursor, signal) =>
    toData(
      await api.GET("/workspace/documents", {
        params: { query: { ...toProject(scope), ...(cursor === null ? {} : { cursor }) } },
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
export function useUploadDocument(scope: Scope) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      return toData(
        await api.POST("/workspace/documents", {
          body: { ...toProject(scope), file },
          bodySerializer: toFormData,
        }),
      );
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: documentKeys.all(scope) }),
  });
}

/** Mutation that deletes one document and refreshes the list. */
export function useDeleteDocument(scope: Scope) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (documentId: string) => {
      await api.DELETE("/workspace/documents/{document_id}", {
        params: { path: { document_id: documentId } },
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: documentKeys.all(scope) }),
  });
}

/** Query options for the file suffixes an upload may have. */
export const documentFormatsQuery = () =>
  queryOptions({
    queryKey: ["documents", "formats"],
    queryFn: async () => toData(await api.GET("/workspace/documents/formats")),
  });
