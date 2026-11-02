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

/** Shows the problem state the assistant has built, one entry per top-level key of the document. */
export function ProblemView({ document }: { document: unknown }) {
  const entries = isRecord(document)
    ? Object.entries(document).filter(([, value]) => !isEmpty(value))
    : [];
  if (entries.length === 0) return <p className="text-muted">Nothing recorded yet.</p>;
  return (
    <dl className="space-y-1.5">
      {entries.map(([name, value]) => (
        <Entry key={name} name={name} value={value} />
      ))}
    </dl>
  );
}
