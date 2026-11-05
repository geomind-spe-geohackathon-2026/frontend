import { isInfeasible } from "@/shared/api/results";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardAction, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Constraint, ConstraintStatus, ResultDetail } from "@/shared/api/types";
import { toCheckTitle, toModuleName } from "./names";
import { TableCell, TableRow } from "@/components/ui/table";
import { DataCell, DataHead, DataTable } from "@/shared/ui/data-table";

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
    <TableRow>
      <DataCell className="font-medium">{toCheckTitle(constraint.title)}</DataCell>
      <TableCell className="py-1.5">
        {constraint.module === null ? null : (
          <Badge variant="off">{toModuleName(constraint.module)}</Badge>
        )}
      </TableCell>
      <TableCell className="py-1.5">
        <Badge variant={tones[constraint.status]}>{words[constraint.status]}</Badge>
      </TableCell>
      <DataCell className="tabular-nums">{toValue(constraint)}</DataCell>
      <DataCell className="text-muted tabular-nums">{constraint.limit}</DataCell>
      <DataCell className={`tabular-nums ${constraint.near ? "text-warn" : "text-muted"}`}>
        {toMargin(constraint)}
      </DataCell>
      <DataCell className="text-muted tabular-nums">{toDate(constraint.worst)}</DataCell>
    </TableRow>
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
        <CardAction>
          <Badge variant={isInfeasible(result) || result.checks.failed > 0 ? "bad" : "ok"}>
            {isInfeasible(result) ? "Infeasible: does not serve every demand" : toSummary(result.checks)}
          </Badge>
        </CardAction>
      </CardHeader>
      <CardContent>
        {result.constraints.length === 0 ? (
          <p className="text-muted">No constraint checks in this result.</p>
        ) : null}
        {rows.length === 0 ? null : (
          <DataTable
            caption={`Constraint checks of ${result.name}`}
            className="max-h-[70vh]"
            head={["Check", "Module", "Status", "Value", "Limit", "Margin", "Worst day"].map(
              (name) => (
                <DataHead key={name}>{name}</DataHead>
              ),
            )}
          >
            {rows.map((constraint) => (
              <Row key={constraint.name} constraint={constraint} />
            ))}
          </DataTable>
        )}
        <MoreChecks
          shown={rows.length}
          total={result.constraints.length}
          onToggle={() => {
            setAll(true);
          }}
        />
      </CardContent>
    </Card>
  );
}
