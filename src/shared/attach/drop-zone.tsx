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

/** The one drop zone for every upload area: a tall dashed box that takes dropped files or opens the file picker from its browse link, and lights up while files are dragged over it; slim is the shorter one under a list. */
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
        "flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border text-center text-sm text-muted-foreground transition-colors data-[over=true]:border-solid data-[over=true]:border-accent data-[over=true]:bg-accent-soft data-[over=true]:text-foreground data-[over=true]:ring-4 data-[over=true]:ring-accent/20 data-[over=true]:[&>*]:pointer-events-none",
        slim ? "min-h-32 px-4 py-6" : "min-h-48 px-6 py-10",
      )}
      onDragOver={(event) => {
        stop(event);
        setOver(true);
      }}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOver(false);
      }}
      onDrop={(event) => {
        stop(event);
        setOver(false);
        if (!disabled) onFiles([...event.dataTransfer.files]);
      }}
    >
      <Upload aria-hidden="true" className={cn(slim ? "size-5" : "size-6", over && "text-accent")} />
      {title === undefined ? null : <p className="font-medium text-foreground">{title}</p>}
      {over ? (
        <span className="font-medium">Drop to add the files</span>
      ) : (
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
      )}
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
