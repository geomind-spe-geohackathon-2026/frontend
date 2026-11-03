import {
  queryOptions,
  useMutation,
  useQueryClient,
  type InfiniteData,
  type Query,
} from "@tanstack/react-query";
import { api, toData } from "@/shared/api/client";
import { toast } from "sonner";
import { pagedQuery, toItems, type Page } from "@/shared/api/pagination";
import type { StudyCreate, Study, StudyStatus } from "@/shared/api/types";

export const studyKeys = {
  all: (projectId: string) => ["projects", projectId, "studies"] as const,
  list: (projectId: string) => [...studyKeys.all(projectId), "list"] as const,
  kinds: () => ["study", "kinds"] as const,
};

const pollMs = 2000;
const activeStatuses: StudyStatus[] = ["queued", "running"];

/** Tells whether any study of the list is queued or running, so the list should be polled. */
export function hasActiveStudy(studies: Study[]): boolean {
  return studies.some((study) => activeStatuses.includes(study.status));
}

/** Infinite query options for the studies of a project; polled every 2 s while one is queued or running. */
export const studiesQuery = (projectId: string) => ({
  ...pagedQuery<Study>(studyKeys.list(projectId), async (cursor, signal) =>
    toData(
      await api.GET("/design/study", {
        params: { query: { project: projectId, ...(cursor === null ? {} : { cursor }) } },
        signal,
      }),
    ),
  ),
  refetchInterval: (query: Query<Page<Study>, Error, InfiniteData<Page<Study>, string | null>>) =>
    hasActiveStudy(toItems(query.state.data?.pages)) ? pollMs : false,
});

/** Query options for the study kinds gemini offers, each with the schema of its settings. */
export const kindsQuery = () =>
  queryOptions({
    queryKey: studyKeys.kinds(),
    queryFn: async ({ signal }) => toData(await api.GET("/design/study/kinds", { signal })),
    staleTime: 5 * 60_000,
  });

/** Mutation that creates a study; the list refreshes when it is in. */
export function useCreateStudy(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: StudyCreate) =>
      toData(await api.POST("/design/study", { body: input })),
    onSuccess: () => {
      toast("Study created");
      return queryClient.invalidateQueries({ queryKey: ["projects", projectId] });
    },
  });
}

/** Mutation that starts a blocked study once the case is completed. */
export function useStartStudy(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (studyId: string) =>
      toData(
        await api.POST("/design/study/{study_id}/start", {
          params: { path: { study_id: studyId } },
        }),
      ),
    onSuccess: () => {
      toast("Study started");
      return queryClient.invalidateQueries({ queryKey: ["projects", projectId] });
    },
  });
}

/** Mutation that cancels a queued or running study. */
export function useCancelStudy(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (studyId: string) =>
      toData(
        await api.POST("/design/study/{study_id}/cancel", {
          params: { path: { study_id: studyId } },
        }),
      ),
    onSuccess: () => {
      toast("Study cancelled");
      return queryClient.invalidateQueries({ queryKey: ["projects", projectId] });
    },
  });
}
