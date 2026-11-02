import { ApiError } from "@/shared/api/errors";

type Props = { error: unknown; what: string };

/** The error state of a screen part: a permission message for 403, otherwise the code and message. */
export function ErrorNotice({ error, what }: Props) {
  if (error instanceof ApiError && error.status === 403) {
    return (
      <p role="alert" className="text-bad">
        You do not have permission to see {what}.
      </p>
    );
  }
  const text =
    error instanceof ApiError ? `${error.code}: ${error.message}` : "Something went wrong";
  return (
    <p role="alert" className="text-bad">
      {what} could not be loaded ({text}).
    </p>
  );
}
