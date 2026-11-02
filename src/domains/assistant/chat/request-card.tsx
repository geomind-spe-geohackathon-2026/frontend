import { useState, type FormEvent } from "react";
import { Button } from "@/shared/ui/button";
import { Field } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
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
      <Field label="Reason (optional)" htmlFor="approval-reason">
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
          variant="primary"
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

function Question({ request, pending, onAnswer }: Omit<Props, "failure">) {
  const [text, setText] = useState("");

  function handleSubmit(event: FormEvent): void {
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
      {request.options === undefined ? (
        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          <div className="flex-1">
            <Field label="Your answer" htmlFor="question-answer">
              <Input
                id="question-answer"
                value={text}
                onChange={(event) => {
                  setText(event.target.value);
                }}
              />
            </Field>
          </div>
          <Button type="submit" variant="primary" disabled={pending || text.trim() === ""}>
            Answer
          </Button>
        </form>
      ) : null}
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
      <p>{request.message}</p>
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
