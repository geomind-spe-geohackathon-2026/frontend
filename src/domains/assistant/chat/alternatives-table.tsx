import { Link } from "react-router-dom";
import { humanise } from "@/shared/quantity/figure";
import { Badge } from "@/components/ui/badge";
import { toAlternatives, type Alternative } from "./alternatives";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

const verdictTones: Record<string, "ok" | "warn" | "bad" | "info" | "off"> = {
  verified: "ok",
  feasible: "info",
  infeasible: "warn",
  rejected: "bad",
  failed: "bad",
  blocked: "warn",
};

function Row({ item, projectId }: { item: Alternative; projectId: string }) {
  return (
    <TableRow className={item.isRecommended ? "bg-accent-soft" : undefined}>
      <TableCell className="py-1 pr-2 tabular-nums text-muted">{item.rank ?? ""}</TableCell>
      <TableCell className="py-1 pr-2 font-medium">
        {humanise(item.family)}
        {item.isRecommended ? (
          <Badge variant="ok" className="ml-1.5">
            Recommended
          </Badge>
        ) : null}
      </TableCell>
      <TableCell className="py-1 pr-2">
        <Badge variant={verdictTones[item.verdict] ?? "off"}>{item.verdict}</Badge>
      </TableCell>
      <TableCell className="py-1 text-muted">
        {item.reason}
        {item.result === null ? null : (
          <Link to={`/projects/${projectId}/design/results`} className="ml-1 underline">
            Result
          </Link>
        )}
      </TableCell>
    </TableRow>
  );
}

/** The design alternatives the agents tried, ranked, with each verdict and the recommended one marked; nothing when there are none. */
export function AlternativesTable({
  document,
  projectId,
}: {
  document: unknown;
  projectId: string;
}) {
  const alternatives = toAlternatives(document);
  if (alternatives === null) return null;
  return (
    <section
      aria-label="Alternatives"
      className="overflow-x-auto rounded-card border border-border bg-surface p-3"
    >
      <h2 className="mb-1.5">Alternatives</h2>
      {alternatives.by === null ? null : (
        <p className="mb-1.5 text-[12.5px] text-muted">Ranked by {humanise(alternatives.by)}</p>
      )}
      <Table className="w-full text-[12.5px]">
        <TableHeader className="text-left text-muted">
          <TableRow>
            <TableHead className="pr-2 font-normal">#</TableHead>
            <TableHead className="pr-2 font-normal">Family</TableHead>
            <TableHead className="pr-2 font-normal">Verdict</TableHead>
            <TableHead className="font-normal">Why</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {alternatives.items.map((item) => (
            <Row key={item.family} item={item} projectId={projectId} />
          ))}
        </TableBody>
      </Table>
    </section>
  );
}
