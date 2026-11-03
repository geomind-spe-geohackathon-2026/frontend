import { useState, type SubmitEvent } from "react";
import { ApiError } from "@/shared/api/errors";
import type { Chat } from "@/shared/api/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useDeleteChat, useRenameChat } from "./api";

type Props = { projectId: string; chat: Chat; onClose: () => void; onDeleted: () => void };

function RenameForm({ projectId, chat, onClose }: Omit<Props, "onDeleted">) {
  const [title, setTitle] = useState(chat.title);
  const rename = useRenameChat(projectId);

  function handleSubmit(event: SubmitEvent): void {
    event.preventDefault();
    rename.mutate({ chatId: chat.id, title }, { onSuccess: onClose });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Field className="gap-1.5">
        <FieldLabel htmlFor="chat-title">Title</FieldLabel>
        <Input
          id="chat-title"
          value={title}
          onChange={(event) => {
            setTitle(event.target.value);
          }}
        />
      </Field>
      {rename.isError ? (
        <p role="alert" className="text-bad">
          {rename.error.message}
        </p>
      ) : null}
      <div className="flex justify-end gap-2">
        <DialogClose asChild>
          <Button>Cancel</Button>
        </DialogClose>
        <Button type="submit" variant="default" disabled={title.trim() === "" || rename.isPending}>
          Rename
        </Button>
      </div>
    </form>
  );
}

function DeleteForm({ projectId, chat, onClose, onDeleted }: Props) {
  const remove = useDeleteChat(projectId);

  function handleDelete(): void {
    remove.mutate(chat.id, {
      onSuccess: () => {
        onClose();
        onDeleted();
      },
    });
  }

  const busy = remove.error instanceof ApiError && remove.error.code === "conflict";
  return (
    <div className="space-y-3">
      <p>Delete the chat &quot;{chat.title}&quot; and its messages? This cannot be undone.</p>
      {remove.isError ? (
        <p role="alert" className="text-bad">
          {busy ? "A run of this chat is still active. Cancel it first." : remove.error.message}
        </p>
      ) : null}
      <div className="flex justify-end gap-2">
        <DialogClose asChild>
          <Button>Keep</Button>
        </DialogClose>
        <Button variant="destructive" disabled={remove.isPending} onClick={handleDelete}>
          Delete chat
        </Button>
      </div>
    </div>
  );
}

type Mode = "rename" | "delete";

/** The rename or delete dialog of one chat; delete asks for confirmation in the page. */
export function ChatDialog({ mode, ...props }: Props & { mode: Mode }) {
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) props.onClose();
      }}
    >
      <DialogContent aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>{mode === "delete" ? "Delete chat" : "Rename chat"}</DialogTitle>
        </DialogHeader>
        {mode === "delete" ? <DeleteForm {...props} /> : <RenameForm {...props} />}
      </DialogContent>
    </Dialog>
  );
}
