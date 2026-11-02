import { HttpResponse } from "msw";

/** Builds a contract error response: {"error": {code, message, details}} with the given status. */
export function toErrorResponse(status: number, code: string, message: string) {
  return HttpResponse.json({ error: { code, message, details: {} } }, { status });
}
