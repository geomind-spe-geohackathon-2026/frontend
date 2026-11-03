import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { api, toData } from "@/shared/api/client";
import type { Document } from "@/shared/api/types";
import { Notice } from "@/shared/ui/notice";
import { PendingNotice } from "@/shared/ui/pending-notice";

const textSuffixes = [".csv", ".md", ".txt", ".json", ".tsv", ".yaml", ".yml"];

function isText(name: string, type: string): boolean {
  return (
    type.startsWith("text/") || textSuffixes.some((suffix) => name.toLowerCase().endsWith(suffix))
  );
}

const fileQuery = (documentId: string) => ({
  queryKey: ["rag", "file", documentId] as const,
  queryFn: async ({ signal }: { signal: AbortSignal }) =>
    toData(
      await api.GET("/workspace/rag/{document_id}/file", {
        params: { path: { document_id: documentId } },
        parseAs: "blob",
        signal,
      }),
    ),
  staleTime: Infinity,
});

function TextBody({ blob }: { blob: Blob }) {
  const text = useQuery({
    queryKey: ["blob-text", blob.size, blob.type],
    queryFn: () => blob.text(),
  });
  if (text.data === undefined) return <Notice status="loading" what="the file" />;
  return (
    <pre className="min-h-0 flex-1 overflow-auto rounded-md bg-sunken p-3 text-[12.5px]">
      {text.data}
    </pre>
  );
}

function FileBody({ document, blob }: { document: Document; blob: Blob }) {
  const url = useMemo(() => URL.createObjectURL(blob), [blob]);
  useEffect(
    () => () => {
      URL.revokeObjectURL(url);
    },
    [url],
  );
  if (isText(document.name, blob.type)) return <TextBody blob={blob} />;
  if (blob.type.startsWith("image/")) {
    return <img src={url} alt={document.name} className="min-h-0 flex-1 object-contain" />;
  }
  return (
    <iframe src={url} title={document.name} className="min-h-0 w-full flex-1 rounded-md border-0" />
  );
}

function ViewerBody({ document }: { document: Document }) {
  const file = useQuery(fileQuery(document.id));
  if (file.isPending) return <Notice status="loading" what="the file" />;
  if (file.isError) return <PendingNotice error={file.error} what="a view of this file" />;
  return <FileBody document={document} blob={file.data} />;
}

/** A large window that shows one file: PDFs and images as the browser shows them, text files as text. */
export function FileViewer({
  document,
  onClose,
}: {
  document: Document | null;
  onClose: () => void;
}) {
  return (
    <Dialog
      open={document !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        aria-describedby={undefined}
        className="flex h-[calc(100svh-4rem)] max-w-[calc(100vw-4rem)] flex-col gap-3 sm:max-w-[calc(100vw-4rem)]"
      >
        <DialogHeader>
          <DialogTitle>{document?.name}</DialogTitle>
        </DialogHeader>
        {document === null ? null : <ViewerBody document={document} />}
      </DialogContent>
    </Dialog>
  );
}
