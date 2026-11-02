import { Quantity } from "@/shared/quantity/quantity";
import type { Usage } from "./types";

/** Tokens in and out and the cost of a run, each with its unit. */
export function UsageLine({ usage }: { usage: Usage }) {
  return (
    <span>
      <Quantity value={usage.input_tokens} unit="tokens in" fractionDigits={0} />
      {" · "}
      <Quantity value={usage.output_tokens} unit="tokens out" fractionDigits={0} />
      {" · "}
      <Quantity value={usage.cost} unit="USD" fractionDigits={3} />
    </span>
  );
}
