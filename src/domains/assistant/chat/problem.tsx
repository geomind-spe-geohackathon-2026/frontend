import type { Project } from "@/shared/api/types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toLabel(value: unknown): string {
  if (typeof value === "string") return value;
  if (isRecord(value)) {
    const text = value.text ?? value.title ?? value.name ?? value.id;
    if (typeof text === "string") return text;
  }
  return JSON.stringify(value);
}

function Entry({ name, value }: { name: string; value: unknown }) {
  if (Array.isArray(value)) {
    return (
      <div>
        <dt className="text-muted">{name}</dt>
        <dd>
          {value.length === 0 ? (
            <span className="text-muted">none</span>
          ) : (
            <ul className="list-disc pl-4">
              {value.map((item, position) => (
                <li key={position}>{toLabel(item)}</li>
              ))}
            </ul>
          )}
        </dd>
      </div>
    );
  }
  return (
    <div>
      <dt className="text-muted">{name}</dt>
      <dd>{toLabel(value)}</dd>
    </div>
  );
}

function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined || value === "") return true;
  if (Array.isArray(value)) return value.length === 0;
  return isRecord(value) && Object.keys(value).length === 0;
}

function Row({ name, value }: { name: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <dt className="text-muted">{name}</dt>
      <dd className="m-0 text-right">{value}</dd>
    </div>
  );
}

function toVersion(version: number | null | undefined): string {
  return version === null || version === undefined ? "none yet" : `version ${String(version)}`;
}

function toCaseText(document: unknown): string {
  return isRecord(document) && isRecord(document.case) ? "read" : "not read yet";
}

const hidden = ["case", "case_origin", "compaction", "version"];

/** Shows what the assistant works from: the project's versions and the notes of this chat. */
export function ProblemView({
  document,
  project,
}: {
  document: unknown;
  project?: Project | undefined;
}) {
  const entries = isRecord(document)
    ? Object.entries(document).filter(([name, value]) => !hidden.includes(name) && !isEmpty(value))
    : [];
  return (
    <dl className="m-0 space-y-1.5">
      <Row name="Case" value={toVersion(project?.case_version)} />
      <Row name="Plant" value={toVersion(project?.plant_version)} />
      <Row name="Case in this chat" value={toCaseText(document)} />
      {entries.map(([name, value]) => (
        <Entry key={name} name={name} value={value} />
      ))}
    </dl>
  );
}
