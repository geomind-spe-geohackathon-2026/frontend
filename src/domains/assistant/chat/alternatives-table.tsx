import { Link } from "react-router-dom";
import { humanise } from "@/shared/quantity/figure";
import { Badge } from "@/components/ui/badge";
import { toAlternatives, type Alternative } from "./alternatives";
import { TableCell, TableRow } from "@/components/ui/table";
import { DataCell, DataHead, DataTable } from "@/shared/ui/data-table";

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
      <TableCell className="py-1.5 tabular-nums text-muted">{item.rank ?? ""}</TableCell>
      <DataCell className="font-medium">{humanise(item.family)}</DataCell>
      <TableCell className="py-1.5">
        <Badge variant={verdictTones[item.verdict] ?? "off"}>{item.verdict}</Badge>
        {item.isRecommended ? (
          <Badge variant="ok" className="ml-1.5">
            Recommended
          </Badge>
        ) : null}
      </TableCell>
      <DataCell className="text-muted">{item.reason}</DataCell>
      <TableCell className="py-1.5">
        {item.result === null ? null : (
          <Link to={`/projects/${projectId}/design/results`} className="underline">
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
      className="rounded-card border border-border bg-surface p-3"
    >
      <h2 className="mb-1.5">Alternatives</h2>
      {alternatives.by === null ? null : (
        <p className="mb-1.5 text-[12.5px] text-muted">Ranked by {humanise(alternatives.by)}</p>
      )}
      <DataTable
        caption="Alternatives"
        className="max-h-96"
        head={
          <>
            <DataHead>#</DataHead>
            <DataHead>Family</DataHead>
            <DataHead>Verdict</DataHead>
            <DataHead>Why</DataHead>
            <DataHead>Result</DataHead>
          </>
        }
      >
        {alternatives.items.map((item) => (
          <Row key={item.family} item={item} projectId={projectId} />
        ))}
      </DataTable>
    </section>
  );
}
