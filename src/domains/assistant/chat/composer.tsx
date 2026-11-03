import { useState, type SubmitEvent } from "react";
import { AttachButton, AttachmentList, toDropProps } from "@/shared/attach/attach-files";
import { toMessageWithFiles } from "@/shared/attach/upload";
import { useAttachments } from "@/shared/attach/use-attachments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  projectId: string;
  sending: boolean;
  active: boolean;
  cancelling: boolean;
  onSend: (content: string) => void;
  onCancel: () => void;
};

/** The message input with attached files: Send while no run is active, Cancel run while one is. */
export function Composer({ projectId, sending, active, cancelling, onSend, onCancel }: Props) {
  const [text, setText] = useState("");
  const files = useAttachments(projectId);

  function handleSubmit(event: SubmitEvent): void {
    event.preventDefault();
    const content = text.trim();
    if (content === "" || active || files.reading) return;
    onSend(toMessageWithFiles(content, files.names));
    setText("");
    files.clear();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2" {...toDropProps(files.add)}>
      <AttachmentList items={files.items} onRemove={files.remove} />
      <div className="flex gap-2">
        <AttachButton onFiles={files.add} />
        <Input
          aria-label="Message"
          placeholder="Tell the assistant what you need"
          value={text}
          onChange={(event) => {
            setText(event.target.value);
          }}
        />
        <Button
          type="submit"
          variant="default"
          disabled={sending || active || files.reading || text.trim() === ""}
        >
          Send
        </Button>
        {active ? (
          <Button
            disabled={cancelling}
            onClick={() => {
              onCancel();
            }}
          >
            Cancel run
          </Button>
        ) : null}
      </div>
    </form>
  );
}
