import { Card } from "@/components/ui/card";
import { StudyRow } from "./study-row";
import { wideColumnClass } from "./columns";
import type { Study } from "@/shared/api/types";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCaption,
} from "@/components/ui/table";
import { tableCardClass } from "@/shared/ui/table-card";

type Props = {
  studies: Study[];
  projectId: string;
  busy: boolean;
  onStart: (studyId: string) => void;
  onCancel: (studyId: string) => void;
};

const columns = ["Study", "Kind", "Started by", "Progress", "Status", "Result", "Actions"];
const wideOnly = new Set(["Kind", "Started by"]);

/** The table of studies, one row each. */
export function StudyTable({ studies, projectId, busy, onStart, onCancel }: Props) {
  return (
    <Card className={`@container ${tableCardClass}`}>
      <Table className="[&_td]:p-2.5 [&_td]:whitespace-normal [&_th]:p-2.5">
        <TableCaption className="sr-only">Studies of this project</TableCaption>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead
                key={column}
                scope="col"
                className={`text-[12.5px] font-medium text-muted ${wideOnly.has(column) ? wideColumnClass : ""}`}
              >
                {column}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
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
        </TableBody>
      </Table>
    </Card>
  );
}
