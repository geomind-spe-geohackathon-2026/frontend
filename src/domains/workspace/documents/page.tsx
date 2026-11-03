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
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from "@/components/ui/table";
import { Notice } from "@/shared/ui/notice";
import { tableCardClass } from "@/shared/ui/table-card";
import { DropZone } from "@/shared/attach/drop-zone";
import { Card } from "@/components/ui/card";

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

function useUploadFiles(projectId: string) {
  const upload = useUploadDocument(projectId);
  const [failure, setFailure] = useState<Error | null>(null);
  const [pending, setPending] = useState(false);
  const send = async (files: File[]) => {
    setPending(true);
    setFailure(null);
    for (const file of files) {
      try {
        await upload.mutateAsync(file);
        toast(`${file.name} uploaded`);
      } catch (error) {
        setFailure(error instanceof Error ? error : new Error("The upload failed"));
      }
    }
    setPending(false);
  };
  return { pending, failure, send: (files: File[]) => void send(files) };
}

function UploadFailure({ error }: { error: Error }) {
  return (
    <p role="alert" className="text-bad">
      {toFieldMessage(error)}
    </p>
  );
}

function UploadButton({
  onFiles,
  pending,
}: {
  onFiles: (files: File[]) => void;
  pending: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <>
      <input
        ref={input}
        type="file"
        multiple
        aria-label="Document file"
        className="sr-only"
        tabIndex={-1}
        onChange={(event: ChangeEvent<HTMLInputElement>) => {
          onFiles([...(event.target.files ?? [])]);
          event.target.value = "";
        }}
      />
      <Button
        variant="default"
        disabled={pending}
        onClick={() => {
          input.current?.click();
        }}
      >
        Upload
      </Button>
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
    <Card className={tableCardClass}>
      <Table className="w-full text-left">
        <TableCaption className="sr-only">Files in the Library</TableCaption>
        <TableHeader className="text-muted">
          <TableRow>
            <TableHead scope="col" className="px-3 py-2 font-medium">
              Name
            </TableHead>
            <TableHead scope="col" className="px-3 py-2 font-medium">
              Size
            </TableHead>
            <TableHead scope="col" className="px-3 py-2 font-medium">
              Searchable
            </TableHead>
            <TableHead scope="col" className="px-3 py-2 font-medium">
              Added
            </TableHead>
            <TableHead scope="col" className="px-3 py-2">
              <span className="sr-only">Action</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {documents.map((document) => (
            <TableRow key={document.id} className="border-t border-border">
              <TableCell className="px-3 py-2">{document.name}</TableCell>
              <TableCell className="px-3 py-2">{toSizeLabel(document.size)}</TableCell>
              <TableCell className="px-3 py-2">
                <Badge variant={searchableTone[document.searchable]}>
                  {searchableText[document.searchable]}
                </Badge>
              </TableCell>
              <TableCell className="px-3 py-2">{toDateLabel(document.created)}</TableCell>
              <TableCell className="px-3 py-2 text-right">
                <Button
                  aria-label={`Delete ${document.name}`}
                  onClick={() => {
                    onDelete(document);
                  }}
                >
                  Delete
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

/** The project Library: upload or drop files, the list with its searchable status, and delete with a confirmation. */
export function DocumentsPage() {
  const projectId = useRequiredParam("projectId");
  const documents = useInfiniteQuery(documentsQuery(projectId));
  const formats = useQuery(documentFormatsQuery());
  const [deleting, setDeleting] = useState<Document | null>(null);
  const items = toItems(documents.data?.pages);
  const upload = useUploadFiles(projectId);
  const accept = formats.data?.join(",");

  return (
    <div className="flex flex-col gap-3">
      <PageHeader
        title="Library"
        description="Data files, reports and papers of the project; the assistant can search them."
        actions={<UploadButton onFiles={upload.send} pending={upload.pending} />}
      />
      {upload.failure === null ? null : <UploadFailure error={upload.failure} />}
      {documents.isPending ? <Notice status="loading" what="documents" /> : null}
      {documents.isError ? <p role="alert">{documents.error.message}</p> : null}
      {documents.isSuccess && items.length === 0 ? (
        <DropZone
          label="Files to add"
          title="No files yet"
          accept={accept}
          disabled={upload.pending}
          onFiles={upload.send}
        />
      ) : null}
      {items.length === 0 ? null : (
        <>
          <DocumentsTable documents={items} onDelete={setDeleting} />
          <DropZone
            label="Files to add"
            accept={accept}
            slim
            disabled={upload.pending}
            onFiles={upload.send}
          />
        </>
      )}
      {documents.hasNextPage ? (
        <Button
          className="self-start"
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
