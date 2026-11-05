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
import {
  documentFormatsQuery,
  documentsQuery,
  useDeleteDocument,
  useUploadDocument,
  type Scope,
} from "./api";
import { toSizeLabel } from "./format";
import { FileViewer } from "./viewer";
import type { Document } from "@/shared/api/types";
import {
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from "@/components/ui/table";
import { Notice } from "@/shared/ui/notice";
import { DataCell, DataTableFrame, dataTableClass } from "@/shared/ui/data-table";
import { DropZone } from "@/shared/attach/drop-zone";

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

function useUploadFiles(scope: Scope) {
  const upload = useUploadDocument(scope);
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
  scope,
  document,
  onClose,
}: {
  scope: Scope;
  document: Document | null;
  onClose: () => void;
}) {
  const remove = useDeleteDocument(scope);
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
  onView,
}: {
  documents: Document[];
  onDelete: (document: Document) => void;
  onView: (document: Document) => void;
}) {
  return (
    <DataTableFrame className="max-h-[70vh]">
        <TableCaption className="sr-only">Files in the Library</TableCaption>
        <TableHeader className={`${dataTableClass.header} text-muted`}>
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
              <DataCell className="px-3">{document.name}</DataCell>
              <TableCell className="px-3 py-2">{toSizeLabel(document.size)}</TableCell>
              <TableCell className="px-3 py-2">
                <Badge variant={searchableTone[document.searchable]}>
                  {searchableText[document.searchable]}
                </Badge>
              </TableCell>
              <TableCell className="px-3 py-2">{toDateLabel(document.created)}</TableCell>
              <RowActions document={document} onDelete={onDelete} onView={onView} />
            </TableRow>
          ))}
        </TableBody>
      </DataTableFrame>
  );
}

function RowActions({
  document,
  onDelete,
  onView,
}: {
  document: Document;
  onDelete: (document: Document) => void;
  onView: (document: Document) => void;
}) {
  return (
    <TableCell className="flex justify-end gap-2 px-3 py-2">
      <Button
        aria-label={`View ${document.name}`}
        onClick={() => {
          onView(document);
        }}
      >
        View
      </Button>
      <Button
        aria-label={`Delete ${document.name}`}
        onClick={() => {
          onDelete(document);
        }}
      >
        Delete
      </Button>
    </TableCell>
  );
}

function LoadMore({
  query,
}: {
  query: {
    hasNextPage: boolean;
    isFetchingNextPage: boolean;
    fetchNextPage: () => Promise<unknown>;
  };
}) {
  if (!query.hasNextPage) return null;
  return (
    <Button
      className="self-start"
      disabled={query.isFetchingNextPage}
      onClick={() => void query.fetchNextPage()}
    >
      Load more
    </Button>
  );
}

type ViewProps = { scope: Scope; title: string; description: string; className: string };

function DocumentsView({ scope, title, description, className }: ViewProps) {
  const documents = useInfiniteQuery(documentsQuery(scope));
  const formats = useQuery(documentFormatsQuery());
  const [deleting, setDeleting] = useState<Document | null>(null);
  const [viewing, setViewing] = useState<Document | null>(null);
  const items = toItems(documents.data?.pages);
  const upload = useUploadFiles(scope);
  const accept = formats.data?.join(",");

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      <PageHeader
        title={title}
        description={description}
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
          <DocumentsTable documents={items} onDelete={setDeleting} onView={setViewing} />
          <DropZone
            label="Files to add"
            accept={accept}
            slim
            disabled={upload.pending}
            onFiles={upload.send}
          />
        </>
      )}
      <LoadMore query={documents} />
      <FileViewer
        document={viewing}
        onClose={() => {
          setViewing(null);
        }}
      />
      <DeleteDialog
        scope={scope}
        document={deleting}
        onClose={() => {
          setDeleting(null);
        }}
      />
    </div>
  );
}

/** The project Library: the project's own files; upload or drop them, see whether they are searchable, delete them. */
export function DocumentsPage() {
  const projectId = useRequiredParam("projectId");
  return (
    <DocumentsView
      scope={projectId}
      title="Library"
      description="Data files, reports and papers of the project; the assistant can search them."
      className=""
    />
  );
}

/** Knowledge: shared documents the agents search (RAG) in every project; papers, reports, standards, catalogues. */
export function KnowledgePage() {
  return (
    <DocumentsView
      scope={null}
      title="Knowledge"
      description="Papers, reports and standards the agents search in every project."
      className="mx-auto w-[min(1040px,100%)]"
    />
  );
}
