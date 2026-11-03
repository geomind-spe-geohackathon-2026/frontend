import { ApiError } from "@/shared/api/errors";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type Props = { error: unknown; what: string; onRetry?: () => void };

/** The error and permission state of a screen: a 403 says access is missing, anything else shows the code. */
export function LoadError({ error, what, onRetry }: Props) {
  const isForbidden = error instanceof ApiError && error.status === 403;
  const detail = error instanceof ApiError ? `${error.code}: ${error.message}` : "unexpected error";
  return (
    <Card role="alert">
      <CardContent className="flex flex-col items-start gap-2">
        <p className="font-medium">
          {isForbidden ? `You do not have access to ${what}.` : `The ${what} could not be loaded.`}
        </p>
        {isForbidden ? null : <p className="text-muted">{detail}</p>}
        {isForbidden || onRetry === undefined ? null : <Button onClick={onRetry}>Try again</Button>}
      </CardContent>
    </Card>
  );
}
