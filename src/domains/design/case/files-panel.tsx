import { Trash2 } from "lucide-react";
import { useState } from "react";
import { isRecord, labelOf } from "@/shared/forms/json-schema";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogContent } from "@/shared/ui/dialog";
import { useRemoveCaseFile } from "./api";
import type { Case } from "@/shared/api/types";

type Props = { projectId: string; saved: Case; content: unknown };

function findUses(node: unknown, path: string[], name: string): string[] {
  if (node === name) return [path.map((part) => labelOf(part, {})).join(" › ")];
  if (!isRecord(node)) return [];
  if (node.file === name) return [path.map((part) => labelOf(part, {})).join(" › ")];
  return Object.entries(node).flatMap(([key, child]) => findUses(child, [...path, key], name));
}

/** A button with the file count that opens the list of files, where an unused one can go. */
export function FilesButton({ projectId, saved, content }: Props) {
  const [open, setOpen] = useState(false);
  const remove = useRemoveCaseFile(projectId);
  return (
    <>
      <Button
        onClick={() => {
          setOpen(true);
        }}
      >
        Files ({saved.files.length})
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent title="Files of this case">
          {saved.files.length === 0 ? (
            <p className="text-muted">No files yet. Upload one where a field asks for it.</p>
          ) : null}
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {saved.files.map((file) => {
              const uses = findUses(content, [], file.name);
              return (
                <li key={file.name} className="flex items-center justify-between gap-2">
                  <span className="min-w-0">
                    <span className="block font-mono text-[12.5px] break-all">{file.name}</span>
                    <span className="text-[12px] text-muted">
                      {uses.length === 0 ? "not used" : `used by ${uses.join(", ")}`}
                    </span>
                  </span>
                  {uses.length > 0 ? null : (
                    <Button
                      aria-label={`Delete ${file.name}`}
                      disabled={remove.isPending}
                      onClick={() => {
                        remove.mutate({ base: saved.version, name: file.name });
                      }}
                    >
                      <Trash2 aria-hidden="true" className="size-3.5" />
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        </DialogContent>
      </Dialog>
    </>
  );
}
