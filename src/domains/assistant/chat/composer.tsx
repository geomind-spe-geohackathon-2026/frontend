import { useState, type FormEvent } from "react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";

type Props = {
  sending: boolean;
  active: boolean;
  cancelling: boolean;
  onSend: (content: string) => void;
  onCancel: () => void;
};

/** The message input: Send while no run is active, Cancel run while one is. */
export function Composer({ sending, active, cancelling, onSend, onCancel }: Props) {
  const [text, setText] = useState("");

  function handleSubmit(event: FormEvent): void {
    event.preventDefault();
    const content = text.trim();
    if (content === "" || active) return;
    onSend(content);
    setText("");
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        aria-label="Message"
        placeholder="Ask about the design"
        value={text}
        onChange={(event) => {
          setText(event.target.value);
        }}
      />
      <Button type="submit" variant="primary" disabled={sending || active || text.trim() === ""}>
        Send
      </Button>
      {active ? (
        <Button disabled={cancelling} onClick={onCancel}>
          Cancel run
        </Button>
      ) : null}
    </form>
  );
}
