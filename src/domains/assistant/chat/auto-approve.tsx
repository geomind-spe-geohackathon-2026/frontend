import { useEffect, useRef, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/cn";
import { InputGroupButton } from "@/components/ui/input-group";
import type { RunRequest } from "@/shared/sse/types";

function toKey(projectId: string): string {
  return `geomind.auto-approve.${projectId}`;
}

function readStored(projectId: string): boolean {
  try {
    return window.localStorage.getItem(toKey(projectId)) === "on";
  } catch {
    return false;
  }
}

/** Whether this project's tool approvals are answered by the browser itself; remembered per project in this browser, off unless turned on. */
export function useAutoApprove(projectId: string): [boolean, (on: boolean) => void] {
  const [on, setOn] = useState(() => readStored(projectId));
  const change = (next: boolean) => {
    setOn(next);
    try {
      window.localStorage.setItem(toKey(projectId), next ? "on" : "off");
    } catch {
      return;
    }
  };
  return [on, change];
}

/** Approves an approval request once, as soon as it shows, while auto-approve is on; questions still wait for the user. */
export function useApproveByItself(
  on: boolean,
  request: RunRequest | null,
  approve: (request: string) => void,
): void {
  const answered = useRef<string | null>(null);
  useEffect(() => {
    if (!on || request?.kind !== "approval" || answered.current === request.request) return;
    answered.current = request.request;
    approve(request.request);
  }, [on, request, approve]);
}

/** The switch next to the usage ring: on, the assistant's tool calls are approved without asking. */
export function AutoApproveButton({
  on,
  onChange,
}: {
  on: boolean;
  onChange: (on: boolean) => void;
}) {
  const title = on
    ? "Auto-approve is on: tool calls run without asking"
    : "Ask before tool calls run";
  return (
    <InputGroupButton
      size="sm"
      aria-pressed={on}
      title={title}
      className={cn(
        "gap-1 rounded-full text-[12px]",
        on ? "text-primary" : "text-muted-foreground",
      )}
      onClick={() => {
        onChange(!on);
      }}
    >
      <ShieldCheck aria-hidden="true" />
      Auto-approve
    </InputGroupButton>
  );
}
