import { toRoundedText, toToolName } from "@/shared/sse/pretty";
import { useState, type SubmitEvent } from "react";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
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
        <FieldLabel htmlFor="approval-reason">Reason (optional)</FieldLabel>
        <Input
          id="approval-reason"
          value={reason}
          onChange={(event) => {
            setReason(event.target.value);
          }}
        />
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
              <Input
                id="question-answer"
                value={text}
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

function toAskText(text: string): string {
  const found = /^Allow (\S+) \((\w+)\)\?/.exec(text);
  if (found === null) return text;
  const effect = found[2] === "write" ? "change the project" : (found[2] ?? "");
  return `${text.slice(0, found.index)}Allow "${toToolName(found[1] ?? "")}" to ${effect}?${text.slice(found.index + found[0].length)}`;
}

function RequestMessage({ message }: { message: string }) {
  const at = message.indexOf(sendsMark);
  const ask = at < 0 ? message : message.slice(0, at).trimEnd();
  const sends = at < 0 ? null : message.slice(at + sendsMark.length).replace(/^\n+/, "");
  return (
    <div className="max-h-[50vh] space-y-2 overflow-y-auto pr-1 text-[13.5px] leading-6">
      <p className="whitespace-pre-line [overflow-wrap:anywhere]">{toAskText(ask)}</p>
      {sends === null ? null : (
        <>
          <p className="text-[12px] text-muted">{sendsMark}</p>
          <pre className="rounded-control bg-sunken p-2 font-mono text-[12px] leading-5 whitespace-pre-wrap [overflow-wrap:anywhere]">
            {sends}
          </pre>
        </>
      )}
    </div>
  );
}

/** The card of a pending request: Approve and Deny with an optional reason, or option buttons or free text. */
export function RequestCard({ request, pending, failure, onAnswer }: Props) {
  return (
    <section
      aria-label={request.kind === "approval" ? "Approval needed" : "Question"}
      className="space-y-2 rounded-card border border-warn bg-warn-soft p-3"
    >
      <h2>{request.kind === "approval" ? "Approval needed" : "The assistant asks"}</h2>
      <RequestMessage message={toRoundedText(request.message)} />
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
