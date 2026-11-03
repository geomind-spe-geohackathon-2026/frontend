import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent } from "@/shared/ui/dialog";
import { Notice } from "@/shared/ui/notice";
import { kindsQuery, useCreateStudy } from "./api";
import { NewStudyForm, type PlantChoice } from "./new-study-form";

type Props = {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plants?: PlantChoice[] | undefined;
};

/** The New study dialog: loads the study kinds and creates the study; given plant versions, it lets the user pick one. */
export function NewStudyDialog({ projectId, open, onOpenChange, plants }: Props) {
  const kinds = useQuery(kindsQuery());
  const create = useCreateStudy(projectId);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="New study" className="max-h-[85vh] overflow-y-auto">
        {kinds.isPending ? <Notice status="loading" what="study kinds" /> : null}
        {kinds.isError ? <Notice status="failed" error={kinds.error} /> : null}
        {kinds.data?.length === 0 ? (
          <Notice status="empty">No study kinds are available.</Notice>
        ) : null}
        {kinds.data !== undefined && kinds.data.length > 0 ? (
          <NewStudyForm
            projectId={projectId}
            kinds={kinds.data}
            plants={plants}
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
