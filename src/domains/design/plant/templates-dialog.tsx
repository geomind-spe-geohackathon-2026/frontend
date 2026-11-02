import { useQuery } from "@tanstack/react-query";
import { useRef } from "react";
import { LoadError } from "@/shared/forms/load-error";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogContent } from "@/shared/ui/dialog";
import { templatesQuery } from "./api";
import { toInlineParts } from "./rst";
import { toWords } from "./spec";

type Props = {
  open: boolean;
  pending: boolean;
  replaces: boolean;
  onPick: (name: string) => void;
  onClose: () => void;
};

function Description({ text }: { text: string }) {
  return (
    <p className="text-muted">
      {toInlineParts(text).map((part, index) =>
        part.isCode ? (
          <code key={index} className="font-mono text-[12px]">
            {part.text}
          </code>
        ) : (
          part.text
        ),
      )}
    </p>
  );
}

/** Lists gemini's named plant templates; picking one saves a new plant version from it. */
export function TemplatesDialog({ open, pending, replaces, onPick, onClose }: Props) {
  const templates = useQuery({ ...templatesQuery(), enabled: open });
  const list = useRef<HTMLUListElement>(null);
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent
        title="Start from a template"
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          list.current?.focus({ preventScroll: true });
        }}
      >
        {replaces ? (
          <p className="text-muted">
            The template becomes a new version; the current plant stays in the history.
          </p>
        ) : null}
        {templates.isPending ? <p className="text-muted">Loading the templates…</p> : null}
        {templates.isError ? <LoadError error={templates.error} what="templates" /> : null}
        <ul
          ref={list}
          tabIndex={-1}
          className="m-0 flex max-h-[60vh] list-none flex-col gap-2 overflow-auto p-0 outline-none"
        >
          {templates.data?.map((template) => (
            <li key={template.name} className="rounded-control border border-border p-2.5">
              <p className="font-medium">{toWords(template.title).join(" ")}</p>
              <p className="font-mono text-[11.5px] text-muted">{template.name}</p>
              <Description text={template.description} />
              <p className="text-[12px] text-muted">
                {template.modules} modules · {template.categories.join(", ")}
              </p>
              {template.purpose === null ? null : (
                <p className="text-[12px] text-muted">{template.purpose}</p>
              )}
              <Button
                className="mt-1.5"
                disabled={pending}
                aria-label={`Use ${template.title}`}
                onClick={() => {
                  onPick(template.name);
                }}
              >
                Use this template
              </Button>
            </li>
          ))}
        </ul>
        <div className="flex justify-end">
          <Button onClick={onClose}>Cancel</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
