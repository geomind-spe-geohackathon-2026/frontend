import { StudyRow } from "./study-row";
import { wideColumnClass } from "./columns";
import type { Study } from "@/shared/api/types";
import {
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCaption,
} from "@/components/ui/table";
import { DataTableFrame, dataTableClass } from "@/shared/ui/data-table";

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
    <DataTableFrame className="@container max-h-[70vh]">
        <TableCaption className="sr-only">Studies of this project</TableCaption>
        <TableHeader className={dataTableClass.header}>
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
      </DataTableFrame>
  );
}
