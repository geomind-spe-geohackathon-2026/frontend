import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toFieldMessage } from "@/shared/api/errors";
import type { ExperienceEntry, KnowledgeEntry } from "@/shared/api/pending";
import { DropZone } from "@/shared/attach/drop-zone";
import { PageHeader } from "@/shared/layout/page-header";
import { Notice } from "@/shared/ui/notice";
import { PendingNotice } from "@/shared/ui/pending-notice";
import { AddKnowledgeButton } from "./add-dialog";
import {
  isKnowledge,
  knowledgeQuery,
  knowledgeSettingsQuery,
  useDeleteKnowledge,
  useImportKnowledge,
  type Section,
} from "./api";
import { ExperienceTable, KnowledgeTable } from "./tables";

function DeleteDialog({ entry, onClose }: { entry: KnowledgeEntry | null; onClose: () => void }) {
  const remove = useDeleteKnowledge("knowledge");
  return (
    <Dialog
      open={entry !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Delete value</DialogTitle>
        </DialogHeader>
        <p>{entry?.item} leaves the knowledge; the agents can no longer find it.</p>
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
              if (entry === null) return;
              remove.mutate(entry.id, {
                onSuccess: () => {
                  toast("Value deleted");
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

function ExperienceDialog({
  entry,
  onClose,
}: {
  entry: ExperienceEntry | null;
  onClose: () => void;
}) {
  return (
    <Dialog
      open={entry !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        aria-describedby={undefined}
        className="max-h-[calc(100svh-4rem)] sm:max-w-2xl"
      >
        <DialogHeader>
          <DialogTitle>{entry?.id}</DialogTitle>
        </DialogHeader>
        <pre className="min-h-0 overflow-auto rounded-md bg-sunken p-3 text-[12.5px]">
          {JSON.stringify(entry, null, 2)}
        </pre>
      </DialogContent>
    </Dialog>
  );
}

function ImportBox() {
  const load = useImportKnowledge();
  return (
    <>
      <DropZone
        label="Catalogue to import (CSV)"
        accept=".csv"
        slim
        disabled={load.isPending}
        onFiles={(files) => {
          const file = files[0];
          if (file === undefined) return;
          load.mutate(file, {
            onSuccess: (result) => {
              toast(
                `${String(result.added)} added, ${String(result.replaced)} replaced, ${String(result.errors.length)} refused`,
              );
            },
          });
        }}
      />
      {load.error === null ? null : (
        <p role="alert" className="text-bad">
          {toFieldMessage(load.error)}
        </p>
      )}
    </>
  );
}

function SectionBody({ section, q, writable }: { section: Section; q: string; writable: boolean }) {
  const entries = useQuery(knowledgeQuery(section, q));
  const [deleting, setDeleting] = useState<KnowledgeEntry | null>(null);
  const [opened, setOpened] = useState<ExperienceEntry | null>(null);
  if (entries.isPending) return <Notice status="loading" what="the knowledge" />;
  if (entries.isError) return <PendingNotice error={entries.error} what="the knowledge" />;
  const knowledge = entries.data.filter(isKnowledge);
  const experience = entries.data.filter((entry): entry is ExperienceEntry => !isKnowledge(entry));
  if (entries.data.length === 0) {
    return <p className="text-muted-foreground">{q === "" ? "Nothing here yet." : "No match."}</p>;
  }
  return section === "knowledge" ? (
    <>
      <KnowledgeTable entries={knowledge} onDelete={writable ? setDeleting : undefined} />
      <DeleteDialog
        entry={deleting}
        onClose={() => {
          setDeleting(null);
        }}
      />
    </>
  ) : (
    <>
      <ExperienceTable entries={experience} onOpen={setOpened} />
      <ExperienceDialog
        entry={opened}
        onClose={() => {
          setOpened(null);
        }}
      />
    </>
  );
}

function useWritable(): boolean {
  const settings = useQuery(knowledgeSettingsQuery());
  return settings.data?.available === true;
}

function NotAvailable() {
  return (
    <p role="status" className="text-muted-foreground">
      The agents&apos; memory is not on this server yet: you can read the knowledge, not change it.
    </p>
  );
}

/** Knowledge: the agents' shared memory; cited values to search, add or import, and past designs to read. */
export function KnowledgePage() {
  const [section, setSection] = useState<Section>("knowledge");
  const [q, setQ] = useState("");
  const writable = useWritable();
  const values = section === "knowledge";
  return (
    <div className="flex flex-col gap-3">
      <PageHeader
        title="Knowledge"
        description="What the agents know across projects: cited values (costs, properties) with their sources, and past designs that passed verification."
        actions={values && writable ? <AddKnowledgeButton /> : undefined}
      />
      <div className="flex flex-wrap items-center gap-3">
        <Tabs
          value={section}
          onValueChange={(value) => {
            setSection(value === "experience" ? "experience" : "knowledge");
          }}
        >
          <TabsList aria-label="Memory section">
            <TabsTrigger value="knowledge">Values</TabsTrigger>
            <TabsTrigger value="experience">Past designs</TabsTrigger>
          </TabsList>
        </Tabs>
        <Input
          type="search"
          aria-label="Search the knowledge"
          placeholder="Search"
          className="max-w-xs"
          value={q}
          onChange={(event) => {
            setQ(event.target.value);
          }}
        />
      </div>
      {writable ? null : <NotAvailable />}
      <SectionBody section={section} q={q} writable={writable} />
      {values && writable ? <ImportBox /> : null}
    </div>
  );
}
