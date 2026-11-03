import { TableScroll } from "@/shared/ui/table-scroll";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { toFieldMessage } from "@/shared/api/errors";
import { useRef, useState, type ChangeEvent } from "react";
import { toDateLabel } from "@/lib/datelabel";
import { toItems } from "@/shared/api/pagination";
import { PageHeader } from "@/shared/layout/page-header";
import { useRequiredParam } from "@/shared/layout/params";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { documentFormatsQuery, documentsQuery, useDeleteDocument, useUploadDocument } from "./api";
import { toSizeLabel } from "./format";
import type { Document } from "@/shared/api/types";

const searchableText: Record<Document["searchable"], string> = {
  pending: "indexing",
  ready: "ready",
  failed: "failed: no text could be read",
};

const searchableTone: Record<Document["searchable"], "ok" | "warn" | "bad"> = {
  pending: "warn",
  ready: "ok",
  failed: "bad",
};

function UploadButton({ projectId }: { projectId: string }) {
  const input = useRef<HTMLInputElement>(null);
  const upload = useUploadDocument(projectId);

  function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file === undefined) return;
    upload.mutate(file, {
      onSuccess: () => {
        toast(`${file.name} uploaded`);
      },
    });
  }

  return (
    <>
      <input
        ref={input}
        type="file"
        aria-label="Document file"
        className="sr-only"
        tabIndex={-1}
        onChange={handleFile}
      />
      <Button
        variant="default"
        disabled={upload.isPending}
        onClick={() => {
          input.current?.click();
        }}
      >
        Upload
      </Button>
      {upload.error === null ? null : <p role="alert">{toFieldMessage(upload.error)}</p>}
    </>
  );
}

function DeleteDialog({
  projectId,
  document,
  onClose,
}: {
  projectId: string;
  document: Document | null;
  onClose: () => void;
}) {
  const remove = useDeleteDocument(projectId);
  return (
    <Dialog
      open={document !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Delete document</DialogTitle>
        </DialogHeader>
        <p>{document?.name} will be removed and the assistant can no longer search it.</p>
        {remove.error === null ? null : (
          <p role="alert" className="text-bad">
            {remove.error.message}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <DialogClose asChild>
            <Button>Keep it</Button>
          </DialogClose>
          <Button
            variant="destructive"
            disabled={remove.isPending}
            onClick={() => {
              if (document === null) return;
              remove.mutate(document.id, {
                onSuccess: () => {
                  toast("Document deleted");
                  onClose();
                },
              });
            }}
          >
            Yes, delete
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DocumentsTable({
  documents,
  onDelete,
}: {
  documents: Document[];
  onDelete: (document: Document) => void;
}) {
  return (
    <TableScroll label="Documents" className="rounded-card border border-border bg-surface">
      <table className="w-full text-left">
        <caption className="sr-only">Documents</caption>
        <thead className="text-muted">
          <tr>
            <th scope="col" className="px-3 py-2 font-medium">
              Name
            </th>
            <th scope="col" className="px-3 py-2 font-medium">
              Size
            </th>
            <th scope="col" className="px-3 py-2 font-medium">
              Searchable
            </th>
            <th scope="col" className="px-3 py-2 font-medium">
              Added
            </th>
            <th scope="col" className="px-3 py-2">
              <span className="sr-only">Action</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {documents.map((document) => (
            <tr key={document.id} className="border-t border-border">
              <td className="px-3 py-2">{document.name}</td>
              <td className="px-3 py-2">{toSizeLabel(document.size)}</td>
              <td className="px-3 py-2">
                <Badge variant={searchableTone[document.searchable]}>
                  {searchableText[document.searchable]}
                </Badge>
              </td>
              <td className="px-3 py-2">{toDateLabel(document.created)}</td>
              <td className="px-3 py-2 text-right">
                <Button
                  aria-label={`Delete ${document.name}`}
                  onClick={() => {
                    onDelete(document);
                  }}
                >
                  Delete
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableScroll>
  );
}

/** The project documents: upload, the list with its searchable status, and delete with a confirmation. */
export function DocumentsPage() {
  const projectId = useRequiredParam("projectId");
  const documents = useInfiniteQuery(documentsQuery(projectId));
  const formats = useQuery(documentFormatsQuery());
  const [deleting, setDeleting] = useState<Document | null>(null);
  const items = toItems(documents.data?.pages);

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Documents"
        description="The assistant can search these."
        actions={<UploadButton projectId={projectId} />}
      />
      {formats.data === undefined ? null : (
        <p className="mb-3 text-[12.5px] text-muted">Supported: {formats.data.join(", ")}</p>
      )}
      {documents.isPending ? <p role="status">Loading documents</p> : null}
      {documents.isError ? <p role="alert">{documents.error.message}</p> : null}
      {documents.isSuccess && items.length === 0 ? (
        <p>No documents yet. Upload a file for the assistant to search.</p>
      ) : null}
      {items.length === 0 ? null : <DocumentsTable documents={items} onDelete={setDeleting} />}
      {documents.hasNextPage ? (
        <Button
          className="mt-3 self-start"
          disabled={documents.isFetchingNextPage}
          onClick={() => void documents.fetchNextPage()}
        >
          Load more
        </Button>
      ) : null}
      <DeleteDialog
        projectId={projectId}
        document={deleting}
        onClose={() => {
          setDeleting(null);
        }}
      />
    </div>
  );
}
