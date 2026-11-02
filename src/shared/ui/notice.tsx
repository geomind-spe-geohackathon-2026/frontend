import type { ReactNode } from "react";
import { ApiError, toFieldMessage } from "@/shared/api/errors";

type Props =
  | { status: "loading"; what: string }
  | { status: "empty"; children: ReactNode }
  | { status: "failed"; error: unknown };

function toFailure(error: unknown): { title: string; text: string } {
  if (error instanceof ApiError && error.status === 403) {
    return {
      title: "No access",
      text: "You do not have permission to see this. Ask the project owner or an admin.",
    };
  }
  if (error instanceof ApiError) return { title: error.code, text: toFieldMessage(error) };
  return { title: "error", text: "Something went wrong." };
}

/** The loading, empty and error (including permission) notice of a data panel. */
export function Notice(props: Props) {
  if (props.status === "loading") {
    return (
      <p role="status" className="py-6 text-center text-muted">
        Loading {props.what}…
      </p>
    );
  }
  if (props.status === "empty") {
    return (
      <div className="rounded-card border border-dashed border-border p-6 text-center text-muted">
        {props.children}
      </div>
    );
  }
  const failure = toFailure(props.error);
  return (
    <div role="alert" className="rounded-card border border-bad bg-bad-soft p-3 text-bad">
      <strong>{failure.title}</strong>
      <p className="mt-0.5">{failure.text}</p>
    </div>
  );
}
