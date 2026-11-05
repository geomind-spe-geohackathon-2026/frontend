import { toToolName } from "@/shared/sse/pretty";
import { withLinks } from "@/shared/sse/tool-views";
import { useState, type SubmitEvent } from "react";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Answer } from "@/shared/api/types";
import type { RunRequest } from "@/shared/sse/types";

type Props = {
  request: RunRequest;
  pending: boolean;
  failure: string | null;
  onAnswer: (answer: Answer) => void;
};

function Approval({ pending, onAnswer }: Pick<Props, "pending" | "onAnswer">) {
  const [reason, setReason] = useState("");
  return (
    <div className="space-y-2">
      <Field className="gap-1.5">
        <FieldLabel htmlFor="approval-reason">Reason or change (optional)</FieldLabel>
        <Input
          id="approval-reason"
          value={reason}
          placeholder="e.g. use 0.06 for the discount rate"
          aria-describedby="approval-hint"
          onChange={(event) => {
            setReason(event.target.value);
          }}
        />
        <p id="approval-hint" className="text-[12px] text-muted">
          To change a value, write what to change here and press Deny: the assistant gets your words
          and proposes again.
        </p>
      </Field>
      <div className="flex gap-2">
        <Button
          variant="default"
          disabled={pending}
          onClick={() => {
            onAnswer({ approved: true });
          }}
        >
          Approve
        </Button>
        <Button
          disabled={pending}
          onClick={() => {
            onAnswer(reason === "" ? { approved: false } : { approved: false, reason });
          }}
        >
          Deny
        </Button>
      </div>
    </div>
  );
}

const stepLimitValues = ["continue", "stop"];

function isStepLimit(request: RunRequest): boolean {
  const values = (request.options ?? []).map((option) => option.value);
  return (
    values.length === stepLimitValues.length &&
    stepLimitValues.every((value) => values.includes(value))
  );
}

function Question({ request, pending, onAnswer }: Omit<Props, "failure">) {
  const [text, setText] = useState("");

  function handleSubmit(event: SubmitEvent): void {
    event.preventDefault();
    if (text.trim() !== "") onAnswer({ text });
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {(request.options ?? []).map((option) => (
          <Button
            key={option.value}
            disabled={pending}
            className="h-auto max-w-full py-1.5 text-left whitespace-normal"
            onClick={() => {
              onAnswer({ text: option.value });
            }}
          >
            {option.label}
          </Button>
        ))}
      </div>
      {isStepLimit(request) ? null : (
        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          <div className="flex-1">
            <Field className="gap-1.5">
              <FieldLabel htmlFor="question-answer">
                {request.options === undefined ? "Your answer" : "Or type your own answer"}
              </FieldLabel>
              <Textarea
                id="question-answer"
                rows={2}
                className="max-h-48"
                value={text}
                placeholder="One value per line is fine. Ctrl+Enter sends."
                onKeyDown={(event) => {
                  if (event.key !== "Enter" || !(event.ctrlKey || event.metaKey)) return;
                  event.preventDefault();
                  if (text.trim() !== "" && !pending) onAnswer({ text });
                }}
                onChange={(event) => {
                  setText(event.target.value);
                }}
              />
            </Field>
          </div>
          <Button type="submit" variant="default" disabled={pending || text.trim() === ""}>
            Answer
          </Button>
        </form>
      )}
    </div>
  );
}

const sendsMark = "What the call sends:";

const toolEffects: Record<string, string> = {
  accept_case:
    "It keeps the case with the changes you approved as the case you gave, the base that later changes are compared with.",
};

function toAskText(text: string): string {
  const found = /^Allow (\S+) \((\w+)\)\?/.exec(text);
  if (found === null) return text;
  const tool = found[1] ?? "";
  const effect = found[2] === "write" ? "change the project" : (found[2] ?? "");
  const rest = text.slice(found.index + found[0].length);
  const said = toolEffects[tool];
  const more = rest.trim() === "" && said !== undefined ? `\n${said}` : rest;
  return `${text.slice(0, found.index)}Allow "${toToolName(tool)}" to ${effect}?${more}`;
}

const preClass =
  "rounded-control bg-sunken p-2 font-mono text-[12px] leading-5 whitespace-pre-wrap [overflow-wrap:anywhere]";

function fromSends(sends: string): Record<string, unknown> | null {
  try {
    const value: unknown = JSON.parse(sends);
    return typeof value === "object" && value !== null && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

function Sends({ sends }: { sends: string }) {
  const fields = fromSends(sends);
  const code = fields !== null && typeof fields.code === "string" ? fields.code : null;
  if (fields === null || code === null) {
    return (
      <>
        <p className="text-[12px] text-muted">{sendsMark}</p>
        <pre className={preClass}>{withLinks(sends)}</pre>
      </>
    );
  }
  const { code: _code, purpose, ...rest } = fields;
  return (
    <>
      {typeof purpose === "string" ? <p className="font-medium">{purpose}</p> : null}
      <p className="text-[12px] text-muted">The code it runs:</p>
      <pre className={`${preClass} max-h-[320px] overflow-auto whitespace-pre`}>{code}</pre>
      {Object.keys(rest).length === 0 ? null : (
        <pre className={preClass}>{withLinks(JSON.stringify(rest, null, 2))}</pre>
      )}
    </>
  );
}

function RequestMessage({ message }: { message: string }) {
  const at = message.indexOf(sendsMark);
  const ask = at < 0 ? message : message.slice(0, at).trimEnd();
  const sends = at < 0 ? null : message.slice(at + sendsMark.length).replace(/^\n+/, "");
  return (
    <div className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain pr-1 text-[13.5px] leading-6">
      <p className="whitespace-pre-line [overflow-wrap:anywhere]">{toAskText(ask)}</p>
      {sends === null ? null : <Sends sends={sends} />}
    </div>
  );
}

/** The card of a pending request: Approve and Deny with an optional reason, or option buttons or free text. */
export function RequestCard({ request, pending, failure, onAnswer }: Props) {
  return (
    <section
      aria-label={request.kind === "approval" ? "Approval needed" : "Question"}
      className="flex max-h-full min-h-0 flex-col gap-2 rounded-card border border-warn bg-warn-soft p-3 [&>*]:shrink-0 [&>*:nth-child(2)]:shrink"
    >
      <h2>{request.kind === "approval" ? "Approval needed" : "The assistant asks"}</h2>
      <RequestMessage message={request.message} />
      {request.kind === "approval" ? (
        <Approval pending={pending} onAnswer={onAnswer} />
      ) : (
        <Question request={request} pending={pending} onAnswer={onAnswer} />
      )}
      {failure === null ? null : (
        <p role="alert" className="text-bad">
          {failure}
        </p>
      )}
    </section>
  );
}
