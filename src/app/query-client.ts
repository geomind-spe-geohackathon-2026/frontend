import { QueryClient } from "@tanstack/react-query";
import { ApiError } from "@/shared/api/errors";

const maxRetries = 2;

function shouldRetry(failureCount: number, error: Error): boolean {
  if (error instanceof ApiError && error.status >= 400 && error.status < 500) return false;
  return failureCount < maxRetries;
}

/** Creates the query client: small stale time, no retry on 4xx answers. */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: { queries: { staleTime: 15_000, retry: shouldRetry } },
  });
}
