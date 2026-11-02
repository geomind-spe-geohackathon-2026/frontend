import { useQuery } from "@tanstack/react-query";
import { LoadError } from "@/shared/forms/load-error";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogContent } from "@/shared/ui/dialog";
import { templatesQuery } from "./api";

type Props = {
  open: boolean;
  pending: boolean;
  replaces: boolean;
  onPick: (name: string) => void;
  onClose: () => void;
};

/** Lists gemini's named plant templates; picking one saves a new plant version from it. */
export function TemplatesDialog({ open, pending, replaces, onPick, onClose }: Props) {
  const templates = useQuery({ ...templatesQuery(), enabled: open });
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent title="Start from a template">
        {replaces ? (
          <p className="text-muted">
            The template becomes a new version; the current plant stays in the history.
          </p>
        ) : null}
        {templates.isPending ? <p className="text-muted">Loading the templates…</p> : null}
        {templates.isError ? <LoadError error={templates.error} what="templates" /> : null}
        <ul className="m-0 flex max-h-[50vh] list-none flex-col gap-2 overflow-auto p-0">
          {templates.data?.map((template) => (
            <li key={template.name} className="rounded-control border border-border p-2.5">
              <p className="font-medium">{template.title}</p>
              <p className="text-muted">{template.description}</p>
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
