import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ApiError, hasCode } from "@/shared/api/errors";
import { projectQuery } from "@/shared/api/projects";
import { ConflictDialog } from "@/shared/forms/conflict-dialog";
import { LoadError } from "@/shared/forms/load-error";
import { NoteDialog } from "@/shared/forms/note-dialog";
import { SchemaForm } from "@/shared/forms/schema-form";
import { UnsavedChangesDialog, useUnsavedGuard } from "@/shared/forms/unsaved-guard";
import { labelOf, sectionsOf, type JsonSchema } from "@/shared/forms/json-schema";
import { PageHeader } from "@/shared/layout/page-header";
import { useRequiredParam } from "@/shared/layout/params";
import { Button } from "@/shared/ui/button";
import { Card, CardBody } from "@/shared/ui/card";
import { Chip } from "@/shared/ui/chip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { showToast } from "@/shared/ui/toast";
import { caseKeys, caseQuery, caseSchemaQuery, useSaveCase } from "./api";
import { BlockerBanner } from "./blocker-banner";
import { FilesPanel } from "./files-panel";
import { HistoryPanel } from "./history-panel";
import { toEmptyCase } from "./empty-case";
import type { Case, CaseContent } from "./types";
import { useCaseEditor } from "./use-case-editor";

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

function StartProblem({ projectId, schema }: { projectId: string; schema: JsonSchema }) {
  const project = useQuery(projectQuery(projectId));
  const save = useSaveCase(projectId);
  return (
    <Card>
      <CardBody className="flex flex-col items-start gap-2">
        <p className="font-medium">This project has no problem yet.</p>
        <p className="text-muted">
          Start an empty problem, then fill in the values the sections ask for.
        </p>
        <Button
          variant="primary"
          disabled={project.data === undefined || save.isPending}
          onClick={() => {
            if (project.data === undefined) return;
            save.mutate({
              base: null,
              note: "Started the problem",
              content: toEmptyCase(schema, project.data.name),
            });
          }}
        >
          Start the problem
        </Button>
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
          showToast(`Problem v${String(next.version)} saved`);
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
  const problems = save.error instanceof ApiError ? readProblems(save.error) : [];
  return {
    save,
    isNoting,
    setIsNoting,
    hasConflict,
    setHasConflict,
    discard,
    submit,
    reload,
    problems,
  };
}

type TabsProps = EditorProps & {
  editor: ReturnType<typeof useCaseEditor>;
  tab: string;
  generation: number;
  onTab: (tab: string) => void;
};

function SectionTabs({ projectId, saved, schema, editor, tab, generation, onTab }: TabsProps) {
  const sections = sectionsOf(schema);
  return (
    <Tabs value={tab} onValueChange={onTab}>
      <TabsList aria-label="Sections of the problem">
        {sections.map((section) => (
          <TabsTrigger key={section} value={section}>
            {labelOf(section, schema.properties?.[section] ?? {})}
          </TabsTrigger>
        ))}
        <TabsTrigger value={filesTab}>Files</TabsTrigger>
        <TabsTrigger value={historyTab}>History</TabsTrigger>
      </TabsList>
      {sections.map((section) => (
        <TabsContent key={section} value={section}>
          <SchemaForm
            key={`${String(saved.version)}-${String(generation)}-${section}`}
            schema={schema.properties?.[section] ?? {}}
            initial={editor.content[section]}
            prefix={section}
            missing={editor.missing.map((item) => item.path)}
            problems={editor.problems}
            onChange={(value, problems) => {
              editor.edit(section, value, problems);
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
      <Chip tone="off">Problem v{version}</Chip>
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
        what="problem"
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
        title="1 · Problem"
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
      <BlockerBanner missing={editor.missing} onShow={handleShow} />
      <ProblemList problems={[...editor.problems, ...flow.problems]} />
      <SectionTabs {...{ projectId, saved, schema, editor, tab, generation }} onTab={showTab} />
      <SaveDialogs flow={flow} content={editor.content} />
      <UnsavedChangesDialog blocker={blocker} />
    </>
  );
}

/** The 1 · Problem page: sections from gemini's case schema, forms with units, validation and versions. */
export function CasePage() {
  const projectId = useRequiredParam("projectId");
  const schema = useQuery(caseSchemaQuery());
  const saved = useQuery(caseQuery(projectId));
  const header = <PageHeader title="1 · Problem" />;
  if (schema.isError) {
    return (
      <>
        {header}
        <LoadError
          error={schema.error}
          what="problem schema"
          onRetry={() => void schema.refetch()}
        />
      </>
    );
  }
  if (saved.isError && !hasCode(saved.error, "case_not_found")) {
    return (
      <>
        {header}
        <LoadError error={saved.error} what="problem" onRetry={() => void saved.refetch()} />
      </>
    );
  }
  if (schema.isPending || saved.isPending) {
    return (
      <>
        {header}
        <p className="text-muted" role="status">
          Loading the problem…
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
