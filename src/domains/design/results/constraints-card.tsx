import { useState } from "react";
import { Button } from "@/shared/ui/button";
import { TableScroll } from "@/shared/ui/table-scroll";
import { Card, CardBody, CardHeader } from "@/shared/ui/card";
import { Chip } from "@/shared/ui/chip";
import type { Constraint, ConstraintStatus, ResultDetail } from "@/shared/api/types";
import { toCheckTitle, toModuleName } from "./names";

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
        {toCheckTitle(constraint.title)}
        {constraint.module === null ? null : (
          <Chip tone="off" className="ml-1.5">
            {toModuleName(constraint.module)}
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

function toImportant(constraints: Constraint[]): Constraint[] {
  return constraints.filter((constraint) => constraint.status !== "pass" || constraint.near);
}

function MoreChecks({
  shown,
  total,
  onToggle,
}: {
  shown: number;
  total: number;
  onToggle: () => void;
}) {
  if (shown === total) return null;
  return (
    <Button className="mt-2" onClick={onToggle}>
      Show all {total} checks
    </Button>
  );
}

/** The constraint checks of a result: a summary chip, the checks that failed or sit at their limit, and the rest on request. */
export function ConstraintsCard({ result }: { result: ResultDetail }) {
  const [all, setAll] = useState(false);
  const rows = all ? result.constraints : toImportant(result.constraints);
  return (
    <Card>
      <CardHeader>
        <h2>Constraints</h2>
        <Chip tone={result.checks.failed > 0 ? "bad" : "ok"}>{toSummary(result.checks)}</Chip>
      </CardHeader>
      <CardBody>
        {result.constraints.length === 0 ? (
          <p className="text-muted">No constraint checks in this result.</p>
        ) : null}
        {rows.length === 0 ? null : (
          <TableScroll label="Constraint checks">
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
                {rows.map((constraint) => (
                  <Row key={constraint.name} constraint={constraint} />
                ))}
              </tbody>
            </table>
          </TableScroll>
        )}
        <MoreChecks
          shown={rows.length}
          total={result.constraints.length}
          onToggle={() => {
            setAll(true);
          }}
        />
      </CardBody>
    </Card>
  );
}
