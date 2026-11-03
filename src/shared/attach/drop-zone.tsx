import { Upload } from "lucide-react";
import { useRef, useState, type DragEvent } from "react";
import { cn } from "@/lib/cn";

type Props = {
  label: string;
  title?: string;
  accept?: string | undefined;
  slim?: boolean;
  disabled?: boolean;
  onFiles: (files: File[]) => void;
};

/** A dashed box that takes dropped files or opens the file picker from its browse link; slim fits under a list. */
export function DropZone({ label, title, accept, slim = false, disabled = false, onFiles }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const stop = (event: DragEvent) => {
    event.preventDefault();
  };
  return (
    <div
      data-slot="drop-zone"
      data-over={over}
      className={cn(
        "flex items-center justify-center gap-2 rounded-lg border border-dashed border-border text-center text-sm text-muted-foreground transition-colors data-[over=true]:border-accent data-[over=true]:bg-accent/5",
        slim ? "flex-row px-4 py-3" : "flex-col px-6 py-10",
      )}
      onDragOver={(event) => {
        stop(event);
        setOver(true);
      }}
      onDragLeave={() => {
        setOver(false);
      }}
      onDrop={(event) => {
        stop(event);
        setOver(false);
        if (!disabled) onFiles([...event.dataTransfer.files]);
      }}
    >
      <Upload aria-hidden="true" className={slim ? "size-4" : "size-6"} />
      {title === undefined ? null : <p className="font-medium text-foreground">{title}</p>}
      <span>
        Drag and drop files here, or{" "}
        <button
          type="button"
          disabled={disabled}
          className="font-medium text-foreground underline underline-offset-4"
          onClick={() => {
            input.current?.click();
          }}
        >
          browse
        </button>
      </span>
      <input
        ref={input}
        type="file"
        multiple
        accept={accept}
        aria-label={label}
        className="sr-only"
        tabIndex={-1}
        onChange={(event) => {
          onFiles([...(event.target.files ?? [])]);
          event.target.value = "";
        }}
      />
    </div>
  );
}
