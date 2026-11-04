import type { ReactNode } from "react";
import { InputGroupButton } from "@/components/ui/input-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Quantity } from "@/shared/quantity/quantity";
import { Ring } from "./ring";
import type { Usage } from "@/shared/sse/types";

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right tabular-nums">{children}</dd>
    </div>
  );
}

type Props = {
  context: number;
  window: number | null;
  usage: Usage;
  cost: number;
  agents: ReactNode;
};

/** Like Claude's composer: a quiet ring that opens what this chat used so far. */
export function UsageRing({ context, window, usage, cost, agents }: Props) {
  const share = window === null || window === 0 ? null : context / window;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <InputGroupButton
          size="icon-sm"
          className="rounded-full text-muted-foreground"
          aria-label="Usage of this chat"
          title="Usage of this chat"
        >
          <Ring share={share} />
        </InputGroupButton>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        side="top"
        className={`${agents === null ? "w-64" : "w-96"} p-3 text-[13px]`}
      >
        <p className="mb-2 font-medium">Usage of this chat</p>
        <dl className="flex flex-col gap-1.5">
          <Row label="Context">
            <Quantity value={context} unit="tokens" fractionDigits={0} />
            {share === null ? null : ` (${String(Math.round(share * 100))}%)`}
          </Row>
          <Row label="Last run in">
            <Quantity value={usage.input_tokens} unit="tokens" fractionDigits={0} />
          </Row>
          <Row label="Last run out">
            <Quantity value={usage.output_tokens} unit="tokens" fractionDigits={0} />
          </Row>
          <Row label="Cost so far">
            <Quantity value={cost} unit="USD" fractionDigits={3} />
          </Row>
        </dl>
        {agents === null ? null : <div className="mt-3 border-t pt-2">{agents}</div>}
      </PopoverContent>
    </Popover>
  );
}
