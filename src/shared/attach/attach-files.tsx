import { Paperclip, X } from "lucide-react";
import { useRef, type ChangeEvent, type DragEvent } from "react";
import { Button } from "@/shared/ui/button";
import { Chip } from "@/shared/ui/chip";
import type { Attachment } from "./use-attachments";

const tones = { reading: "info", ready: "ok", failed: "bad" } as const;
const words = { reading: "reading", ready: "ready", failed: "failed" } as const;

/** Props that make an element take dropped files. */
export function toDropProps(onFiles: (files: File[]) => void) {
  return {
    onDragOver: (event: DragEvent) => {
      event.preventDefault();
    },
    onDrop: (event: DragEvent) => {
      event.preventDefault();
      onFiles([...event.dataTransfer.files]);
    },
  };
}

/** The paperclip button that opens the file picker. */
export function AttachButton({ onFiles }: { onFiles: (files: File[]) => void }) {
  const input = useRef<HTMLInputElement>(null);

  function handleChange(event: ChangeEvent<HTMLInputElement>): void {
    onFiles([...(event.target.files ?? [])]);
    event.target.value = "";
  }

  return (
    <>
      <input
        ref={input}
        type="file"
        multiple
        aria-label="Files to attach"
        className="sr-only"
        tabIndex={-1}
        onChange={handleChange}
      />
      <Button
        aria-label="Attach files"
        onClick={() => {
          input.current?.click();
        }}
      >
        <Paperclip aria-hidden="true" className="size-4" />
      </Button>
    </>
  );
}

/** The attached files with their state; a file can be taken off the message. */
export function AttachmentList({
  items,
  onRemove,
}: {
  items: Attachment[];
  onRemove: (name: string) => void;
}) {
  if (items.length === 0) return null;
  return (
    <ul aria-label="Attached files" className="flex flex-wrap gap-2">
      {items.map((item) => (
        <li
          key={item.name}
          className="flex items-center gap-2 rounded-control border border-border bg-surface px-2 py-1"
        >
          <span className="max-w-56 truncate">{item.name}</span>
          <Chip tone={tones[item.state]}>{words[item.state]}</Chip>
          {item.message === null ? null : <span className="text-bad">{item.message}</span>}
          <button
            type="button"
            aria-label={`Remove ${item.name}`}
            className="text-muted hover:text-text"
            onClick={() => {
              onRemove(item.name);
            }}
          >
            <X aria-hidden="true" className="size-3.5" />
          </button>
        </li>
      ))}
    </ul>
  );
}
