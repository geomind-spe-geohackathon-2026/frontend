import type { DomainRoutes } from "@/shared/layout/routes";

export const assistantRoutes: DomainRoutes = {
  project: [
    {
      path: "assistant/chat/:chatId?",
      lazy: () => import("./chat/page").then((m) => ({ Component: m.ChatPage })),
    },
    {
      path: "assistant/runs",
      lazy: () => import("./runs/page").then((m) => ({ Component: m.RunsPage })),
    },
    {
      path: "assistant/runs/:runId",
      lazy: () => import("./runs/log-page").then((m) => ({ Component: m.RunLogPage })),
    },
  ],
};
