import type { FlowsheetCreate, ParametersUpdate, PlantRangesUpdate } from "@/shared/api/types";

export type { PlantSpec } from "@/shared/plant/types";
export type SaveFlowsheetInput = Omit<FlowsheetCreate, "project">;
export type SaveParametersInput = Omit<ParametersUpdate, "project">;
export type SavePlantRangesInput = Omit<PlantRangesUpdate, "project">;
