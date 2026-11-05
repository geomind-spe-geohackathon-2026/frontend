import { History } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type Props = {
  what: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
};

/** A History button beside Save version that opens the saved versions in a window that fills most of the screen. */
export function HistoryButton({ what, open, onOpenChange, children }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <History aria-hidden="true" />
          History
        </Button>
      </DialogTrigger>
      <DialogContent className="flex h-[calc(100svh-4rem)] max-w-[calc(100vw-4rem)] flex-col sm:max-w-[calc(100vw-4rem)]">
        <DialogHeader>
          <DialogTitle>History</DialogTitle>
          <DialogDescription>Saved versions of the {what}, newest first.</DialogDescription>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </DialogContent>
    </Dialog>
  );
}

/** Reads the version number a link asks History to open (?version=N), if any. */
export function toVersionParam(params: URLSearchParams): number | undefined {
  const asked = Number(params.get("version"));
  return Number.isInteger(asked) && asked > 0 ? asked : undefined;
}
