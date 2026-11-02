import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { AttachButton, AttachmentList, toDropProps } from "@/shared/attach/attach-files";
import { toMessageWithFiles } from "@/shared/attach/upload";
import { useAttachments } from "@/shared/attach/use-attachments";
import { Button } from "@/shared/ui/button";
import { useAskAssistant } from "./api";

const starters = [
  "Design a plant from these files at the lowest cost",
  "Read the brief and tell me what is missing",
  "Compare the plant options for this project",
];

function Starters({ onPick }: { onPick: (text: string) => void }) {
  return starters.map((starter) => (
    <button
      key={starter}
      type="button"
      className="rounded-pill border border-border bg-surface px-2.5 py-1 text-muted hover:border-accent hover:text-text"
      onClick={() => {
        onPick(starter);
      }}
    >
      {starter}
    </button>
  ));
}

/** The start of a project: say what you want, add the files, and the assistant takes it from there. */
export function AskBox({ projectId }: { projectId: string }) {
  const navigate = useNavigate();
  const [text, setText] = useState("");
  const ask = useAskAssistant(projectId);
  const files = useAttachments(projectId);
  const blocked = ask.isPending || files.reading || text.trim() === "";

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (blocked) return;
    ask.mutate(toMessageWithFiles(text.trim(), files.names), {
      onSuccess: (chatId) => {
        void navigate(`/projects/${projectId}/assistant/chat/${chatId}`);
      },
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      aria-label="Ask the assistant"
      className="flex flex-col gap-3 rounded-card border border-accent bg-accent-soft p-4"
      {...toDropProps(files.add)}
    >
      <div>
        <h2 className="text-[17px] font-semibold">What do you want to design?</h2>
        <p className="text-muted">
          Add your brief and data files and say what you need. The assistant does the work and asks
          you when it has to.
        </p>
      </div>
      <textarea
        aria-label="Ask the assistant"
        rows={3}
        placeholder="For example: design a plant that covers all days at the lowest cost"
        className="w-full resize-y rounded-control border border-border bg-surface px-3 py-2 text-text placeholder:text-muted"
        value={text}
        onChange={(event) => {
          setText(event.target.value);
        }}
      />
      <AttachmentList items={files.items} onRemove={files.remove} />
      <div className="flex flex-wrap items-center gap-2">
        <AttachButton onFiles={files.add} />
        <Starters onPick={setText} />
        <div className="flex-1" />
        <Button type="submit" variant="primary" disabled={blocked}>
          Ask
        </Button>
      </div>
      {ask.error === null ? null : (
        <p role="alert" className="text-bad">
          {ask.error.message}
        </p>
      )}
    </form>
  );
}
