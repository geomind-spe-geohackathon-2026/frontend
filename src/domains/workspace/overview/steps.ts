import type { Project } from "@/shared/api/types";

export const designSteps: {
  key: keyof Project["progress"];
  number: number;
  name: string;
  route: string;
  description: string;
}[] = [
  {
    key: "case",
    number: 1,
    name: "Problem",
    route: "design/case",
    description: "Demand, site, constraints, prices",
  },
  {
    key: "plant",
    number: 2,
    name: "Plant",
    route: "design/plant",
    description: "Flowsheet and equipment",
  },
  {
    key: "study",
    number: 3,
    name: "Study",
    route: "design/study",
    description: "Size, minimize, uncertainty",
  },
  {
    key: "results",
    number: 4,
    name: "Results",
    route: "design/results",
    description: "Capacities, checks, compare",
  },
  {
    key: "report",
    number: 5,
    name: "Report",
    route: "design/report",
    description: "Deliverable from a design",
  },
];
