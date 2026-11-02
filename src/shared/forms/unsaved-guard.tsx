import { useEffect } from "react";
import { useBlocker, type Blocker } from "react-router-dom";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogContent } from "@/shared/ui/dialog";

/** Blocks in-app navigation and tab close while there are unsaved changes; render the dialog with the result. */
export function useUnsavedGuard(dirty: boolean): Blocker {
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      dirty && currentLocation.pathname !== nextLocation.pathname,
  );
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => {
      window.removeEventListener("beforeunload", warn);
    };
  }, [dirty]);
  return blocker;
}

/** The in-page dialog that asks whether to leave a page with unsaved changes. */
export function UnsavedChangesDialog({ blocker }: { blocker: Blocker }) {
  const isBlocked = blocker.state === "blocked";
  return (
    <Dialog
      open={isBlocked}
      onOpenChange={(open) => {
        if (!open && isBlocked) blocker.reset();
      }}
    >
      <DialogContent title="Unsaved changes">
        <p>Leaving this page discards the changes you have not saved.</p>
        <div className="flex justify-end gap-2">
          <Button
            onClick={() => {
              if (isBlocked) blocker.reset();
            }}
          >
            Stay on this page
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              if (isBlocked) blocker.proceed();
            }}
          >
            Leave and discard
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
