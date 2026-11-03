import { Link } from "react-router-dom";
import { humanise } from "@/shared/quantity/figure";
import { Chip } from "@/shared/ui/chip";
import { toAlternatives, type Alternative } from "./alternatives";

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
    <tr className={item.isRecommended ? "bg-accent-soft" : undefined}>
      <td className="py-1 pr-2 tabular-nums text-muted">{item.rank ?? ""}</td>
      <td className="py-1 pr-2 font-medium">
        {humanise(item.family)}
        {item.isRecommended ? (
          <Chip tone="ok" className="ml-1.5">
            Recommended
          </Chip>
        ) : null}
      </td>
      <td className="py-1 pr-2">
        <Chip tone={verdictTones[item.verdict] ?? "off"}>{item.verdict}</Chip>
      </td>
      <td className="py-1 text-muted">
        {item.reason}
        {item.result === null ? null : (
          <Link to={`/projects/${projectId}/design/results`} className="ml-1 underline">
            Result
          </Link>
        )}
      </td>
    </tr>
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
      <table className="w-full text-[12.5px]">
        <thead className="text-left text-muted">
          <tr>
            <th className="pr-2 font-normal">#</th>
            <th className="pr-2 font-normal">Family</th>
            <th className="pr-2 font-normal">Verdict</th>
            <th className="font-normal">Why</th>
          </tr>
        </thead>
        <tbody>
          {alternatives.items.map((item) => (
            <Row key={item.family} item={item} projectId={projectId} />
          ))}
        </tbody>
      </table>
    </section>
  );
}
