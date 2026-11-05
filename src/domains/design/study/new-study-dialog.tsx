import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Notice } from "@/shared/ui/notice";
import { kindsQuery, useCreateStudy } from "./api";
import { NewStudyForm } from "./new-study-form";

import type { Study } from "@/shared/api/types";

type Props = {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template?: Study | null;
};

/** The New study dialog: loads the study kinds and creates the study; a template study fills kind, name, settings and plant version ("Run again"). */
export function NewStudyDialog({ projectId, open, onOpenChange, template = null }: Props) {
  const kinds = useQuery(kindsQuery());
  const create = useCreateStudy(projectId);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined} className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {template === null ? "New study" : `Run ${template.name} again`}
          </DialogTitle>
        </DialogHeader>
        {kinds.isPending ? <Notice status="loading" what="study kinds" /> : null}
        {kinds.isError ? <Notice status="failed" error={kinds.error} /> : null}
        {kinds.data?.length === 0 ? (
          <Notice status="empty">No study kinds are available.</Notice>
        ) : null}
        {kinds.data !== undefined && kinds.data.length > 0 ? (
          <NewStudyForm
            key={template?.id ?? "new"}
            template={template}
            projectId={projectId}
            kinds={kinds.data}
            error={create.error}
            pending={create.isPending}
            onSubmit={(input) => {
              create.mutate(input, {
                onSuccess: () => {
                  onOpenChange(false);
                },
              });
            }}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
