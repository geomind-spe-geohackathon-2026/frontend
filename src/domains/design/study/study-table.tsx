import { TableScroll } from "@/shared/ui/table-scroll";
import { Card } from "@/components/ui/card";
import { StudyRow } from "./study-row";
import type { Study } from "@/shared/api/types";

type Props = {
  studies: Study[];
  projectId: string;
  busy: boolean;
  onStart: (studyId: string) => void;
  onCancel: (studyId: string) => void;
};

const columns = ["Study", "Kind", "Started by", "Progress", "Status", "Result", "Actions"];

/** The table of studies, one row each. */
export function StudyTable({ studies, projectId, busy, onStart, onCancel }: Props) {
  return (
    <Card>
      <TableScroll label="Studies">
        <table className="w-full border-collapse text-left [&_td]:p-2.5 [&_th]:p-2.5">
          <caption className="sr-only">Studies of this project</caption>
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column} scope="col" className="text-[12.5px] font-medium text-muted">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {studies.map((study) => (
              <StudyRow
                key={study.id}
                study={study}
                projectId={projectId}
                busy={busy}
                onStart={onStart}
                onCancel={onCancel}
              />
            ))}
          </tbody>
        </table>
      </TableScroll>
    </Card>
  );
}
