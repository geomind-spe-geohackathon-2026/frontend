import { ApiError } from "@/shared/api/errors";
import { ErrorNotice } from "@/shared/sse/notice";

/** The error of a page whose routes the server may not offer yet: a 404 says so plainly, other errors as usual. */
export function PendingNotice({ error, what }: { error: Error; what: string }) {
  if (error instanceof ApiError && error.status === 404) {
    return (
      <p role="status" className="text-muted-foreground">
        This server does not offer {what} yet.
      </p>
    );
  }
  return <ErrorNotice error={error} what={what} />;
}
