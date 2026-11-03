import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

type Props = {
  open: boolean;
  pending: boolean;
  onSave: (note: string) => void;
  onClose: () => void;
};

/** Asks for the note of a new version and confirms the save. */
export function NoteDialog({ open, pending, onSave, onClose }: Props) {
  const [note, setNote] = useState("");
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Save a new version</DialogTitle>
        </DialogHeader>
        <form
          className="flex flex-col gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            onSave(note.trim());
          }}
        >
          <Field className="gap-1.5">
            <FieldLabel htmlFor="version-note">Note</FieldLabel>
            <Input
              id="version-note"
              value={note}
              onChange={(event) => {
                setNote(event.target.value);
              }}
            />
          </Field>
          <div className="flex justify-end gap-2">
            <Button onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="default" disabled={pending}>
              Save version
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
