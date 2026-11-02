import { useState } from "react";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogContent } from "@/shared/ui/dialog";
import { Field } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";

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
      <DialogContent title="Save a new version">
        <form
          className="flex flex-col gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            onSave(note.trim());
          }}
        >
          <Field label="Note" htmlFor="version-note">
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
            <Button type="submit" variant="primary" disabled={pending}>
              Save version
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
