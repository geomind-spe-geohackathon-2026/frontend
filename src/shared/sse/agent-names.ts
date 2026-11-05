const agentNames: Record<string, string> = {
  coordinator: "Coordinator",
  project_lead: "Project lead",
  case_lead: "Case lead",
  geoscientist: "Geoscientist",
  design_lead: "Design lead",
  family_design_lead: "Family design lead",
  process_engineer: "Process engineer",
  reservoir_engineer: "Reservoir engineer",
  well_engineer: "Well engineer",
  energy_systems_engineer: "Energy systems engineer",
  integration_engineer: "Integration engineer",
  analysis_lead: "Analysis lead",
  economist: "Economist",
  support_lead: "Support lead",
  curator: "Curator",
  summarizer: "Summarizer",
  reviewer: "Reviewer",
  explainer: "Explainer",
};

function toWords(id: string): string {
  const words = id.replaceAll("_", " ").trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** The display name of an agent from its id or dotted path (its last part): the known name, else the id in words. */
export function toAgentName(path: string): string {
  const id = path.split(".").at(-1) ?? path;
  return agentNames[id] ?? toWords(id);
}
