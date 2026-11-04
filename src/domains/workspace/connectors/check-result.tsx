import { Circle, CircleCheck, CircleX } from "lucide-react";
import type { CheckStep, Connector } from "@/shared/api/pending";

const stepWords: Record<string, string> = {
  reachable: "Server reachable",
  initialize: "Server answered",
  auth: "Sign-in accepted",
  tools: "Tools listed",
};

const icons = { ok: CircleCheck, failed: CircleX, skipped: Circle };
const tones = { ok: "text-ok", failed: "text-bad", skipped: "text-muted-foreground" };

function Step({ step }: { step: CheckStep }) {
  const Icon = icons[step.status];
  return (
    <li className="flex items-start gap-2">
      <Icon aria-label={step.status} className={`mt-0.5 size-3.5 shrink-0 ${tones[step.status]}`} />
      <span>
        {stepWords[step.name] ?? step.name}
        {step.reason === null ? null : (
          <span className="text-muted-foreground"> · {step.reason}</span>
        )}
      </span>
    </li>
  );
}

function toServerLine(info: Connector["server_info"]): string | null {
  if (info === null || info === undefined) return null;
  const parts = [
    info.name,
    info.version,
    info.protocol === null ? null : `protocol ${info.protocol}`,
  ];
  const shown = parts.filter((part) => part !== null);
  return shown.length === 0 ? null : shown.join(" · ");
}

/** The answer of the last Check of a connector: each step ok, failed with its reason, or skipped, the server and the time it took. */
export function CheckResult({ result }: { result: Connector }) {
  const steps = result.steps ?? [];
  if (steps.length === 0) return null;
  const server = toServerLine(result.server_info);
  return (
    <section
      aria-label={`Check of ${result.name}`}
      className="mt-2 flex flex-col gap-1 text-[12.5px]"
    >
      <ul className="m-0 flex list-none flex-col gap-1 p-0">
        {steps.map((step) => (
          <Step key={step.name} step={step} />
        ))}
      </ul>
      <p className="text-muted-foreground">
        {[
          server,
          result.elapsed_ms === null || result.elapsed_ms === undefined
            ? null
            : `${String(result.elapsed_ms)} ms`,
        ]
          .filter((part) => part !== null)
          .join(" · ")}
      </p>
    </section>
  );
}
