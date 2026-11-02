import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ApiError, hasCode } from "@/shared/api/errors";
import { toItems } from "@/shared/api/pagination";
import { projectQuery } from "@/shared/api/projects";
import { ConflictDialog } from "@/shared/forms/conflict-dialog";
import type { SeriesSource } from "@/shared/forms/field-context";
import { LoadError } from "@/shared/forms/load-error";
import { NoteDialog } from "@/shared/forms/note-dialog";
import { SchemaForm } from "@/shared/forms/schema-form";
import { UnsavedChangesDialog, useUnsavedGuard } from "@/shared/forms/unsaved-guard";
import {
  isRecord,
  labelOf,
  sectionsOf,
  withHeader,
  type JsonSchema,
} from "@/shared/forms/json-schema";
import { PageHeader } from "@/shared/layout/page-header";
import { useRequiredParam } from "@/shared/layout/params";
import { Button } from "@/shared/ui/button";
import { Card, CardBody } from "@/shared/ui/card";
import { Chip } from "@/shared/ui/chip";
import { Notice } from "@/shared/ui/notice";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { showToast } from "@/shared/ui/toast";
import {
  caseKeys,
  caseQuery,
  caseSchemaQuery,
  copySourcesQuery,
  readCaseFile,
  useCopyCase,
  useSaveCase,
  useUploadCaseFile,
} from "./api";
import { BlockerBanner } from "./blocker-banner";
import { FilesPanel } from "./files-panel";
import { HistoryPanel } from "./history-panel";
import { toEmptyCase } from "./empty-case";
import type { Case, MissingValue } from "@/shared/api/types";
import type { CaseContent } from "./types";
import { toRequirementText } from "./requirement-text";
import { useCaseEditor } from "./use-case-editor";

const REQUIREMENTS = "requirements";
const REQUIREMENTS_HINT =
  "After a run each requirement shows pass or fail under Results and in the report, and Optimise counts a broken one as infeasible.";
const filesTab = "files";
const historyTab = "history";

function focusField(path: string): void {
  let candidate = path;
  while (candidate !== "") {
    const element = document.getElementById(`field-${candidate}`);
    if (element !== null) {
      element.focus();
      return;
    }
    candidate = candidate.split(".").slice(0, -1).join(".");
  }
}

function ProblemList({ problems }: { problems: { path: string; message: string }[] }) {
  if (problems.length === 0) return null;
  return (
    <Card className="mb-3.5 border-bad" role="region" aria-label="Problems">
      <CardBody>
        <p className="font-medium text-bad">
          {problems.length} {problems.length === 1 ? "problem" : "problems"} to fix before saving
        </p>
        <ul className="m-0 list-none p-0">
          {problems.map((problem) => (
            <li key={`${problem.path}:${problem.message}`}>
              <span className="font-mono">{problem.path}</span> {problem.message}
            </li>
          ))}
        </ul>
      </CardBody>
    </Card>
  );
}

function SaveFailure({ error }: { error: unknown }) {
  if (error === null || error === undefined) return null;
  if (error instanceof ApiError && "latest" in error.details) return null;
  return (
    <div className="mb-3.5 flex flex-col gap-2">
      <Notice status="failed" error={error} />
      {error instanceof ApiError ? <ProblemList problems={readProblems(error)} /> : null}
    </div>
  );
}

function ImportCase({ onContent }: { onContent: (content: CaseContent) => void }) {
  const [failure, setFailure] = useState<string | null>(null);
  async function handleFile(file: File) {
    try {
      const content: unknown = JSON.parse(await file.text());
      if (!isRecord(content)) throw new Error("not an object");
      setFailure(null);
      onContent(content);
    } catch {
      setFailure(`${file.name} is not a case file`);
    }
  }
  return (
    <div className="flex flex-col gap-1">
      <label className="font-medium" htmlFor="case-file">
        Import a case.json file
      </label>
      <input
        id="case-file"
        type="file"
        accept=".json,application/json"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file !== undefined) void handleFile(file);
        }}
      />
      {failure === null ? null : (
        <p role="alert" className="text-bad">
          {failure}
        </p>
      )}
    </div>
  );
}

function CopyCase({ projectId }: { projectId: string }) {
  const projects = useInfiniteQuery(copySourcesQuery());
  const copy = useCopyCase(projectId);
  const [source, setSource] = useState("");
  const others = toItems(projects.data?.pages).filter(
    (project) => project.id !== projectId && project.case_version !== null,
  );
  return (
    <div className="flex flex-col gap-1">
      <label className="font-medium" htmlFor="case-source">
        Copy from another project
      </label>
      <div className="flex flex-wrap items-center gap-2">
        <select
          id="case-source"
          className="rounded-control border border-border bg-surface px-2 py-[7px]"
          value={source}
          onChange={(event) => {
            setSource(event.target.value);
          }}
        >
          <option value="">Choose a project</option>
          {others.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
        <Button
          disabled={source === "" || copy.isPending}
          onClick={() => {
            copy.mutate(source);
          }}
        >
          Copy
        </Button>
      </div>
      <SaveFailure error={copy.error} />
    </div>
  );
}

function toStepHint(schema: JsonSchema): string {
  return sectionsOf(schema)
    .filter((section) => section !== "initial_state")
    .map((section) => labelOf(section, schema.properties?.[section] ?? {}))
    .join(" → ");
}

function StartProblem({ projectId, schema }: { projectId: string; schema: JsonSchema }) {
  const project = useQuery(projectQuery(projectId));
  const save = useSaveCase(projectId);
  return (
    <Card>
      <CardBody className="flex flex-col items-start gap-4">
        <p className="font-medium">This project has no case yet.</p>
        <p className="text-muted">
          Start empty and fill in the sections in this order: {toStepHint(schema)}.
        </p>
        <Button
          variant="primary"
          disabled={project.data === undefined || save.isPending}
          onClick={() => {
            if (project.data === undefined) return;
            save.mutate({
              base: null,
              note: "Started the case",
              content: toEmptyCase(schema, project.data.name),
            });
          }}
        >
          Start the case
        </Button>
        <CopyCase projectId={projectId} />
        <ImportCase
          onContent={(content) => {
            save.mutate({ base: null, note: "Imported a case file", content });
          }}
        />
        <SaveFailure error={save.error} />
      </CardBody>
    </Card>
  );
}

function readProblems(error: ApiError): { path: string; message: string }[] {
  const problems = error.details.problems;
  if (!Array.isArray(problems)) return [];
  return problems.flatMap((problem: unknown) => {
    if (typeof problem !== "object" || problem === null) return [];
    const path = "path" in problem ? problem.path : null;
    const message = "message" in problem ? problem.message : null;
    return typeof path === "string" && typeof message === "string" ? [{ path, message }] : [];
  });
}

type EditorProps = { projectId: string; saved: Case; schema: JsonSchema };

function useSaveFlow(projectId: string, saved: Case, onDiscard: () => void) {
  const queryClient = useQueryClient();
  const save = useSaveCase(projectId);
  const [isNoting, setIsNoting] = useState(false);
  const [hasConflict, setHasConflict] = useState(false);
  const discard = () => {
    onDiscard();
    save.reset();
  };
  const submit = (note: string, content: CaseContent) => {
    save.mutate(
      { base: saved.version, note, content },
      {
        onSuccess: (next) => {
          setIsNoting(false);
          discard();
          showToast(`Case v${String(next.version)} saved`);
        },
        onError: (error) => {
          setIsNoting(false);
          if (error instanceof ApiError && "latest" in error.details) setHasConflict(true);
        },
      },
    );
  };
  const reload = () => {
    setHasConflict(false);
    discard();
    void queryClient.invalidateQueries({ queryKey: caseKeys.all(projectId) });
  };
  return {
    save,
    isNoting,
    setIsNoting,
    hasConflict,
    setHasConflict,
    discard,
    submit,
    reload,
  };
}

type TabsProps = EditorProps & {
  editor: ReturnType<typeof useCaseEditor>;
  tab: string;
  generation: number;
  onTab: (tab: string) => void;
};

function MissingCount({ missing, section }: { missing: MissingValue[]; section: string }) {
  const count = missing.filter(
    (item) => item.path === section || item.path.startsWith(`${section}.`),
  ).length;
  if (count === 0) return null;
  return (
    <Chip tone="warn" className="ml-1.5" aria-hidden="true">
      {count}
    </Chip>
  );
}

function SectionTabs({ projectId, saved, schema, editor, tab, generation, onTab }: TabsProps) {
  const sections = sectionsOf(schema);
  const upload = useUploadCaseFile(projectId);
  const series: SeriesSource = {
    scope: `${projectId}-${String(saved.version)}`,
    files: saved.files.map((file) => file.name),
    time: editor.content.time,
    uploadBlocked: editor.dirty,
    read: (file) => readCaseFile(projectId, saved.version, file),
    upload: (file) => {
      upload.mutate({ base: saved.version, name: `data/${file.name}`, file });
    },
  };
  return (
    <Tabs value={tab} onValueChange={onTab}>
      <TabsList aria-label="Sections of the case">
        {sections.map((section) => (
          <TabsTrigger key={section} value={section}>
            {labelOf(section, schema.properties?.[section] ?? {})}
            <MissingCount missing={editor.missing} section={section} />
          </TabsTrigger>
        ))}
        <TabsTrigger value={filesTab}>Files</TabsTrigger>
        <TabsTrigger value={historyTab}>History</TabsTrigger>
      </TabsList>
      {sections.map((section) => (
        <TabsContent key={section} value={section}>
          {section === REQUIREMENTS ? <p className="mb-2 text-muted">{REQUIREMENTS_HINT}</p> : null}
          <SchemaForm
            key={`${String(saved.version)}-${String(generation)}-${section}`}
            schema={schema.properties?.[section] ?? {}}
            initial={editor.content[section]}
            prefix={section}
            missing={editor.missing.map((item) => item.path)}
            problems={editor.problems}
            series={series}
            describeItem={toRequirementText}
            onChange={(value, problems) => {
              const shown = withHeader(schema.properties?.[section] ?? {}, section, value);
              editor.edit(section, shown, problems);
            }}
          />
        </TabsContent>
      ))}
      <TabsContent value={filesTab}>
        <FilesPanel projectId={projectId} saved={saved} dirty={editor.dirty} />
      </TabsContent>
      <TabsContent value={historyTab}>
        <HistoryPanel projectId={projectId} current={saved.version} />
      </TabsContent>
    </Tabs>
  );
}

type ActionsProps = {
  version: number;
  dirty: boolean;
  canSave: boolean;
  onDiscard: () => void;
  onSave: () => void;
};

function CaseActions({ version, dirty, canSave, onDiscard, onSave }: ActionsProps) {
  return (
    <>
      <Chip tone="off">Case v{version}</Chip>
      {dirty ? <span className="text-[12px] text-warn">unsaved changes</span> : null}
      <Button disabled={!dirty} onClick={onDiscard}>
        Discard changes
      </Button>
      <Button variant="primary" disabled={!canSave} onClick={onSave}>
        Save version
      </Button>
    </>
  );
}

function SaveDialogs({
  flow,
  content,
}: {
  flow: ReturnType<typeof useSaveFlow>;
  content: CaseContent;
}) {
  return (
    <>
      <NoteDialog
        open={flow.isNoting}
        pending={flow.save.isPending}
        onSave={(note) => {
          flow.submit(note, content);
        }}
        onClose={() => {
          flow.setIsNoting(false);
        }}
      />
      <ConflictDialog
        open={flow.hasConflict}
        what="case"
        onKeep={() => {
          flow.setHasConflict(false);
        }}
        onReload={flow.reload}
      />
    </>
  );
}

function CaseEditor({ projectId, saved, schema }: EditorProps) {
  const editor = useCaseEditor(saved);
  const [params, setParams] = useSearchParams();
  const [generation, setGeneration] = useState(0);
  const flow = useSaveFlow(projectId, saved, () => {
    editor.reset();
    setGeneration((value) => value + 1);
  });
  const blocker = useUnsavedGuard(editor.dirty);
  const tab = params.get("tab") ?? sectionsOf(schema)[0] ?? filesTab;
  const canSave = editor.dirty && editor.problems.length === 0 && !editor.isChecking;
  const showTab = (next: string) => {
    setParams({ tab: next }, { replace: true });
  };
  const handleShow = (path: string) => {
    showTab(path.split(".")[0] ?? tab);
    setTimeout(() => {
      focusField(path);
    }, 0);
  };
  return (
    <>
      <PageHeader
        title="1 · Case"
        description="Everything the design needs that is not the plant."
        actions={
          <CaseActions
            version={saved.version}
            dirty={editor.dirty}
            canSave={canSave && !flow.save.isPending}
            onDiscard={flow.discard}
            onSave={() => {
              flow.setIsNoting(true);
            }}
          />
        }
      />
      <BlockerBanner missing={editor.missing} schema={schema} onShow={handleShow} />
      <ProblemList problems={editor.problems} />
      <SaveFailure error={flow.save.error} />
      <SectionTabs {...{ projectId, saved, schema, editor, tab, generation }} onTab={showTab} />
      <SaveDialogs flow={flow} content={editor.content} />
      <UnsavedChangesDialog blocker={blocker} />
    </>
  );
}

/** The 1 · Case page: sections from gemini's case schema, forms with units, validation and versions. */
export function CasePage() {
  const projectId = useRequiredParam("projectId");
  const schema = useQuery(caseSchemaQuery());
  const saved = useQuery(caseQuery(projectId));
  const header = <PageHeader title="1 · Case" />;
  if (schema.isError) {
    return (
      <>
        {header}
        <LoadError error={schema.error} what="case schema" onRetry={() => void schema.refetch()} />
      </>
    );
  }
  if (saved.isError && !hasCode(saved.error, "case_not_found")) {
    return (
      <>
        {header}
        <LoadError error={saved.error} what="case" onRetry={() => void saved.refetch()} />
      </>
    );
  }
  if (schema.isPending || saved.isPending) {
    return (
      <>
        {header}
        <p className="text-muted" role="status">
          Loading the case…
        </p>
      </>
    );
  }
  if (saved.isError) {
    return (
      <>
        {header}
        <StartProblem projectId={projectId} schema={schema.data} />
      </>
    );
  }
  return <CaseEditor projectId={projectId} saved={saved.data} schema={schema.data} />;
}
