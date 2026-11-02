import type { DomainRoutes } from "@/shared/layout/routes";

export const designRoutes: DomainRoutes = {
  project: [
    {
      path: "design/case",
      lazy: () => import("./case/page").then((m) => ({ Component: m.CasePage })),
    },
    {
      path: "design/plant",
      lazy: () => import("./plant/page").then((m) => ({ Component: m.PlantPage })),
    },
    {
      path: "design/study",
      lazy: () => import("./study/page").then((m) => ({ Component: m.StudyPage })),
    },
    {
      path: "design/results/:resultId?",
      lazy: () => import("./results/page").then((m) => ({ Component: m.ResultsPage })),
    },
    {
      path: "design/report",
      lazy: () => import("./report/page").then((m) => ({ Component: m.ReportPage })),
    },
  ],
};
