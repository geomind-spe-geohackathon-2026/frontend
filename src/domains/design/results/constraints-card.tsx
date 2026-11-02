import { Card, CardBody, CardHeader } from "@/shared/ui/card";
import { Chip } from "@/shared/ui/chip";
import type { Constraint, ConstraintStatus, ResultDetail } from "@/shared/api/types";

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

const dateFormat = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeZone: "UTC" });
const figure = new Intl.NumberFormat("en", { maximumFractionDigits: 3 });

function toValue(constraint: Constraint): string {
  if (constraint.value === null) return constraint.message;
  const unit = constraint.unit === "-" ? "" : ` ${constraint.unit}`;
  return `${figure.format(constraint.value)}${unit}`;
}

function toMargin(constraint: Constraint): string {
  if (constraint.margin === null) return "-";
  const unit = constraint.unit === "-" ? "" : ` ${constraint.unit}`;
  return `${figure.format(constraint.margin)}${unit}`;
}

function toDate(worst: string | null): string {
  return worst === null ? "-" : dateFormat.format(Date.parse(worst));
}

function Row({ constraint }: { constraint: Constraint }) {
  return (
    <tr>
      <th scope="row" className="text-left font-medium">
        {constraint.title}
        {constraint.module === null ? null : (
          <Chip tone="off" className="ml-1.5 font-mono">
            {constraint.module}
          </Chip>
        )}
      </th>
      <td>
        <Chip tone={tones[constraint.status]}>{words[constraint.status]}</Chip>
      </td>
      <td className="tabular-nums">{toValue(constraint)}</td>
      <td className="text-muted tabular-nums">{constraint.limit}</td>
      <td className={`tabular-nums ${constraint.near ? "text-warn" : "text-muted"}`}>
        {toMargin(constraint)}
      </td>
      <td className="text-muted tabular-nums">{toDate(constraint.worst)}</td>
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
          <div className="overflow-x-auto">
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
                  {["Value", "Limit", "Margin", "Worst day"].map((name) => (
                    <th key={name} scope="col" className="text-[12.5px] font-medium text-muted">
                      {name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.constraints.map((constraint) => (
                  <Row key={constraint.name} constraint={constraint} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
