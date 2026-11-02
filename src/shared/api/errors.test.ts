import { describe, expect, it } from "vitest";
import { ApiError, toFieldMessage } from "./errors";

function toError(details: Record<string, unknown>): ApiError {
  return new ApiError({
    status: 422,
    code: "validation_failed",
    message: "Request validation failed",
    details,
  });
}

describe("toFieldMessage", () => {
  it("names each field of the details with its message", () => {
    const error = toError({ fields: { email: "not a valid email", name: "required" } });
    expect(toFieldMessage(error)).toBe("email: not a valid email; name: required");
  });

  it("keeps the message of an error without field details", () => {
    expect(toFieldMessage(toError({}))).toBe("Request validation failed");
    expect(toFieldMessage(toError({ fields: "x" }))).toBe("Request validation failed");
  });
});
