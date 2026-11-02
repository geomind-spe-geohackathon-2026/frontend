import { Card, CardBody, CardHeader } from "@/shared/ui/card";
import { Chip } from "@/shared/ui/chip";
import type { Constraint, ConstraintStatus, ResultDetail } from "@/shared/api/design";

type Tone = "ok" | "bad" | "off";

const tones: Record<ConstraintStatus, Tone> = { pass: "ok", fail: "bad", not_assessed: "off" };
const words: Record<ConstraintStatus, string> = {
  pass: "pass",
  fail: "fail",
  not_assessed: "not assessed",
};

function toSummary(checks: ResultDetail["checks"]): string {
  const total = checks.passed + checks.failed + checks.not_assessed;
  return `${String(checks.passed)} of ${String(total)} pass`;
}

function Row({ constraint }: { constraint: Constraint }) {
  return (
    <tr>
      <th scope="row" className="text-left font-medium">
        {constraint.title}
      </th>
      <td>
        <Chip tone={tones[constraint.status]}>{words[constraint.status]}</Chip>
      </td>
      <td className="text-muted">{constraint.message}</td>
    </tr>
  );
}

/** The constraint checks of a result: a summary chip and one row per check with its status and message. */
export function ConstraintsCard({ result }: { result: ResultDetail }) {
  return (
    <Card>
      <CardHeader>
        <h2>Constraints</h2>
        <Chip tone={result.checks.failed > 0 ? "bad" : "ok"}>{toSummary(result.checks)}</Chip>
      </CardHeader>
      <CardBody>
        {result.constraints.length === 0 ? (
          <p className="text-muted">No constraint checks in this result.</p>
        ) : (
          <table className="w-full border-collapse text-left [&_td]:p-2 [&_th]:p-2">
            <caption className="sr-only">Constraint checks of {result.name}</caption>
            <thead>
              <tr>
                <th scope="col" className="text-[12.5px] font-medium text-muted">
                  Check
                </th>
                <th scope="col" className="text-[12.5px] font-medium text-muted">
                  Status
                </th>
                <th scope="col" className="text-[12.5px] font-medium text-muted">
                  Message
                </th>
              </tr>
            </thead>
            <tbody>
              {result.constraints.map((constraint) => (
                <Row key={constraint.name} constraint={constraint} />
              ))}
            </tbody>
          </table>
        )}
      </CardBody>
    </Card>
  );
}
