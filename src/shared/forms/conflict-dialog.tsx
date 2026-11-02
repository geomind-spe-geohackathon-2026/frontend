import { Button } from "@/shared/ui/button";
import { Dialog, DialogContent } from "@/shared/ui/dialog";

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
      <DialogContent title="A newer version exists">
        <p>
          The {what} was saved by someone else while you were editing. Reload to see the latest
          version; your unsaved changes will be discarded.
        </p>
        <div className="flex justify-end gap-2">
          <Button onClick={onKeep}>Keep editing</Button>
          <Button variant="primary" onClick={onReload}>
            Reload latest
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
