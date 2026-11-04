import { ClipboardList, FlaskConical, Workflow, type LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import type { View } from "./view";

type Hint = { to: string; label: string; icon: LucideIcon; tools: string[] };

const hints: Hint[] = [
  {
    to: "design/case",
    label: "Open Case",
    icon: ClipboardList,
    tools: ["accept_case", "save_profile", "set_case", "save_mcp_table"],
  },
  {
    to: "design/plant",
    label: "Open Plant",
    icon: Workflow,
    tools: ["build_plant", "patch_plant", "merge_designs", "set_ranges"],
  },
  {
    to: "design/study",
    label: "Open Study",
    icon: FlaskConical,
    tools: ["size_plant", "optimize", "sample_uncertainty", "evolve_structure"],
  },
];

/** The design pages a finished run changed: one per page, in Case, Plant, Study order. */
export function toHints(view: View): Hint[] {
  if (view.status !== "done") return [];
  const used = new Set(
    view.blocks.flatMap((block) =>
      block.kind === "tool" && block.state === "done" ? [block.tool] : [],
    ),
  );
  return hints.filter((hint) => hint.tools.some((tool) => used.has(tool)));
}

/** After a run changed the case, plant or a study, offers to open that page in the side panel next to the chat. */
export function PanelHints({
  projectId,
  chatId,
  view,
}: {
  projectId: string;
  chatId: string | null;
  view: View;
}) {
  const shown = toHints(view);
  if (shown.length === 0) return null;
  const chat = chatId === null ? "" : `?chat=${chatId}`;
  return (
    <nav aria-label="Open what the assistant changed" className="flex flex-wrap items-center gap-2">
      <span className="text-[12.5px] text-muted-foreground">The assistant changed:</span>
      {shown.map((hint) => (
        <Button key={hint.to} asChild variant="outline" size="sm" className="rounded-full">
          <Link to={`/projects/${projectId}/${hint.to}${chat}`}>
            <hint.icon aria-hidden="true" />
            {hint.label}
          </Link>
        </Button>
      ))}
    </nav>
  );
}
