import { useState, type KeyboardEvent, type ReactNode, type SubmitEvent } from "react";
import { ArrowUp, Square } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { AttachButton, AttachmentList, toDropProps } from "@/shared/attach/attach-files";
import { toMessageWithFiles } from "@/shared/attach/upload";
import { clearDraft, readDraft, updateDraft } from "@/shared/attach/chat-draft";
import type { useAttachments } from "@/shared/attach/use-attachments";
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

function SendButton({
  active,
  cancelling,
  disabled,
  onCancel,
}: {
  active: boolean;
  cancelling: boolean;
  disabled: boolean;
  onCancel: () => void;
}) {
  if (active) {
    return (
      <InputGroupButton
        size="icon-sm"
        variant="default"
        className="rounded-full"
        aria-label={cancelling ? "Stopping the run" : "Cancel run"}
        title={cancelling ? "Stopping after the current step" : "Cancel run"}
        disabled={cancelling}
        onClick={() => {
          onCancel();
        }}
      >
        {cancelling ? <Spinner /> : <Square aria-hidden="true" className="fill-current" />}
      </InputGroupButton>
    );
  }
  return (
    <InputGroupButton
      type="submit"
      size="icon-sm"
      variant="default"
      className="rounded-full"
      aria-label="Send"
      title="Send"
      disabled={disabled}
    >
      <ArrowUp aria-hidden="true" />
    </InputGroupButton>
  );
}

type Props = {
  projectId: string;
  sending: boolean;
  active: boolean;
  cancelling: boolean;
  onSend: (content: string) => void;
  onCancel: () => void;
  files: ReturnType<typeof useAttachments>;
  status?: ReactNode;
};

/** The message box, like a chat app: attach on the left; the chat's cost and log, then Send (or Cancel run while one is active) on the right. */
export function Composer({
  projectId,
  sending,
  active,
  cancelling,
  onSend,
  onCancel,
  files,
  status,
}: Props) {
  const [text, setText] = useState(() => readDraft(projectId));

  function handleSubmit(event: SubmitEvent): void {
    event.preventDefault();
    const content = text.trim();
    if (content === "" || active || files.reading) return;
    onSend(toMessageWithFiles(content, files.names));
    setText("");
    clearDraft(projectId);
    files.clear();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2" {...toDropProps(files.add)}>
      <AttachmentList items={files.items} onRemove={files.remove} />
      <InputGroup className="rounded-2xl shadow-sm">
        <InputGroupTextarea
          aria-label="Message"
          placeholder="Tell the assistant what you need"
          rows={1}
          className="max-h-48 min-h-14 px-4 pt-4 pb-2"
          value={text}
          onKeyDown={submitOnEnter}
          onChange={(event) => {
            setText(event.target.value);
            updateDraft(projectId, event.target.value);
          }}
        />
        <InputGroupAddon align="block-end" className="gap-2">
          <AttachButton onFiles={files.add} />
          <span className="flex-1" />
          {status}
          <SendButton
            active={active}
            cancelling={cancelling}
            disabled={sending || files.reading || text.trim() === ""}
            onCancel={onCancel}
          />
        </InputGroupAddon>
      </InputGroup>
    </form>
  );
}
