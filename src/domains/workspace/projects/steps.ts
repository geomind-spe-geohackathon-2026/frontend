import type { Project } from "@/shared/api/types";

export const stepNames: { key: keyof Project["progress"]; name: string }[] = [
  { key: "case", name: "Problem" },
  { key: "plant", name: "Plant" },
  { key: "study", name: "Study" },
  { key: "results", name: "Results" },
  { key: "report", name: "Report" },
];
