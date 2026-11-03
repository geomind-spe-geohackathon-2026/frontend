import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type Props = { open: boolean; what: string; onReload: () => void; onKeep: () => void };

/** The prompt shown after a 409 on save: someone saved a newer version; reload it or keep editing. */
export function ConflictDialog({ open, what, onReload, onKeep }: Props) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onKeep();
      }}
    >
      <DialogContent aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>A newer version exists</DialogTitle>
        </DialogHeader>
        <p>
          The {what} was saved by someone else while you were editing. Reload to see the latest
          version; your unsaved changes will be discarded.
        </p>
        <div className="flex justify-end gap-2">
          <Button onClick={onKeep}>Keep editing</Button>
          <Button variant="default" onClick={onReload}>
            Reload latest
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
