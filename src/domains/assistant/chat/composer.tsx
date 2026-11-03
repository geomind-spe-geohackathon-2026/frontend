import { useState, type KeyboardEvent, type SubmitEvent } from "react";
import { AttachButton, AttachmentList, toDropProps } from "@/shared/attach/attach-files";
import { toMessageWithFiles } from "@/shared/attach/upload";
import { useAttachments } from "@/shared/attach/use-attachments";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "@/components/ui/input-group";

function submitOnEnter(event: KeyboardEvent<HTMLTextAreaElement>): void {
  if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) return;
  event.preventDefault();
  event.currentTarget.form?.requestSubmit();
}

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
      <InputGroup>
        <InputGroupTextarea
          aria-label="Message"
          placeholder="Tell the assistant what you need"
          rows={2}
          className="max-h-48 min-h-14"
          value={text}
          onKeyDown={submitOnEnter}
          onChange={(event) => {
            setText(event.target.value);
          }}
        />
        <InputGroupAddon align="block-end">
          <AttachButton onFiles={files.add} />
          <span className="flex-1" />
          {active ? (
            <InputGroupButton
              size="sm"
              disabled={cancelling}
              onClick={() => {
                onCancel();
              }}
            >
              Cancel run
            </InputGroupButton>
          ) : null}
          <InputGroupButton
            type="submit"
            size="sm"
            variant="default"
            disabled={sending || active || files.reading || text.trim() === ""}
          >
            Send
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </form>
  );
}
