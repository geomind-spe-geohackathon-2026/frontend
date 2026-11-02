import type { Flowsheet, FlowsheetCreate, ParametersUpdate } from "@/shared/api/types";

export type PlantSpec = Flowsheet["spec"];
export type SaveFlowsheetInput = Omit<FlowsheetCreate, "project">;
export type SaveParametersInput = Omit<ParametersUpdate, "project">;
