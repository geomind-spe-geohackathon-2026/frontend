import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { useAskAssistant } from "./api";

/** The Ask the assistant box: creates a chat with the first message and opens it. */
export function AskBox({ projectId }: { projectId: string }) {
  const navigate = useNavigate();
  const [text, setText] = useState("");
  const ask = useAskAssistant(projectId);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = text.trim();
    if (content === "") return;
    ask.mutate(content, {
      onSuccess: (chatId) => {
        void navigate(`/projects/${projectId}/assistant/chat/${chatId}`);
      },
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      aria-label="Ask the assistant"
      className="flex flex-col gap-2 rounded-card border border-accent bg-accent-soft p-2.5"
    >
      <div className="flex gap-2">
        <Input
          aria-label="Ask the assistant"
          placeholder="Ask the assistant, for example: design a plant that covers all days at the lowest cost"
          value={text}
          onChange={(event) => {
            setText(event.target.value);
          }}
        />
        <Button type="submit" variant="primary" disabled={ask.isPending || text.trim() === ""}>
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
