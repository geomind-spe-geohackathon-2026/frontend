import { QueryClient } from "@tanstack/react-query";
import { ApiError } from "@/shared/api/errors";

const maxRetries = 2;
const maxRateRetries = 4;
const rateDelayMs = 5_000;

function isRateLimited(error: Error): boolean {
  return error instanceof ApiError && error.status === 429;
}

function shouldRetry(failureCount: number, error: Error): boolean {
  if (isRateLimited(error)) return failureCount < maxRateRetries;
  if (error instanceof ApiError && error.status >= 400 && error.status < 500) return false;
  return failureCount < maxRetries;
}

function toRetryDelay(failureCount: number, error: Error): number {
  if (isRateLimited(error)) return rateDelayMs * 2 ** failureCount;
  return Math.min(1_000 * 2 ** failureCount, 30_000);
}

/** Creates the query client: small stale time, no retry on 4xx answers. */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: { queries: { staleTime: 15_000, retry: shouldRetry, retryDelay: toRetryDelay } },
  });
}
