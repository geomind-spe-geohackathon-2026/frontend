import { Tokens } from "@/shared/quantity/usage";
import { Quantity } from "@/shared/quantity/quantity";
import type { Usage } from "./types";

/** Tokens in and out and the cost of a run, each with its unit. */
export function UsageLine({ usage }: { usage: Usage }) {
  return (
    <span>
      <Tokens value={usage.input_tokens} unit="tokens in" />
      {" · "}
      <Tokens value={usage.output_tokens} unit="tokens out" />
      {" · "}
      <Quantity value={usage.cost} unit="USD" fractionDigits={3} />
    </span>
  );
}
