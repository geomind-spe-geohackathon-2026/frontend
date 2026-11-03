import type { ReactNode } from "react";
import { CircleAlert } from "lucide-react";
import { ApiError, toFieldMessage } from "@/shared/api/errors";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Empty } from "@/components/ui/empty";
import { Spinner } from "@/components/ui/spinner";

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
      <p role="status" className="flex items-center justify-center gap-2 py-6 text-muted">
        <Spinner role={undefined} aria-hidden="true" aria-label={undefined} />
        Loading {props.what}…
      </p>
    );
  }
  if (props.status === "empty") {
    return <Empty className="border p-6 text-muted md:p-6">{props.children}</Empty>;
  }
  const failure = toFailure(props.error);
  return (
    <Alert variant="destructive" className="border-bad bg-bad-soft">
      <CircleAlert aria-hidden="true" />
      <AlertTitle>{failure.title}</AlertTitle>
      <AlertDescription>{failure.text}</AlertDescription>
    </Alert>
  );
}
