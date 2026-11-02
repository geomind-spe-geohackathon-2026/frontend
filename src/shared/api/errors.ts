type ErrorBody = { error: { code: string; message: string; details: Record<string, unknown> } };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isErrorBody(value: unknown): value is ErrorBody {
  if (!isRecord(value) || !isRecord(value.error)) return false;
  return typeof value.error.code === "string" && typeof value.error.message === "string";
}

/** The contract error: HTTP status plus the stable code, message and details of the error body. */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: Record<string, unknown>;

  constructor(input: {
    status: number;
    code: string;
    message: string;
    details?: Record<string, unknown>;
  }) {
    super(input.message);
    this.name = "ApiError";
    this.status = input.status;
    this.code = input.code;
    this.details = input.details ?? {};
  }
}

/** Converts a failed response into an ApiError, using the contract error body when present. */
export async function fromResponse(response: Response): Promise<ApiError> {
  const body: unknown = await response.json().catch(() => null);
  if (!isErrorBody(body)) {
    return new ApiError({
      status: response.status,
      code: "unknown_error",
      message: `Request failed with status ${String(response.status)}`,
    });
  }
  const { code, message, details } = body.error;
  return new ApiError({
    status: response.status,
    code,
    message,
    details: isRecord(details) ? details : {},
  });
}

/** Tells whether an unknown thrown value is an ApiError with the given code. */
export function hasCode(error: unknown, code: string): boolean {
  return error instanceof ApiError && error.code === code;
}

/** Writes an error as one line: each field of its details with the message, else the error message. */
export function toFieldMessage(error: Error): string {
  if (!(error instanceof ApiError)) return error.message;
  const fields = error.details.fields;
  if (!isRecord(fields)) return error.message;
  const lines = Object.entries(fields).map(([name, text]) => `${name}: ${String(text)}`);
  return lines.length === 0 ? error.message : lines.join("; ");
}
