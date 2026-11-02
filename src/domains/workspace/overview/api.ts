import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, toData } from "@/shared/api/client";

export const overviewKeys = {
  detail: (projectId: string) => ["projects", projectId, "overview"] as const,
};

/** Query options for the overview of one project: progress, recent chats, activity and active runs. */
export const overviewQuery = (projectId: string) =>
  queryOptions({
    queryKey: overviewKeys.detail(projectId),
    queryFn: async ({ signal }) =>
      toData(
        await api.GET("/workspace/overview", { params: { query: { project: projectId } }, signal }),
      ),
  });

/** Mutation that creates a chat with a first message and answers the new chat id. */
export function useAskAssistant(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (content: string) => {
      const chat = toData(await api.POST("/assistant/chat", { body: { project: projectId } }));
      toData(
        await api.POST("/assistant/chat/{chat_id}/messages", {
          params: { path: { chat_id: chat.id } },
          body: { content },
        }),
      );
      return chat.id;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: overviewKeys.detail(projectId) }),
  });
}
