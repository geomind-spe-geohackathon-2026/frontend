import { useInfiniteQuery } from "@tanstack/react-query";
import { useDeferredValue, useRef, useState, type ChangeEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toItems } from "@/shared/api/pagination";
import { PageHeader } from "@/shared/layout/page-header";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { showToast } from "@/shared/ui/toast";
import { projectsQuery, useImportProject } from "./api";
import { NewProjectDialog } from "./new-project-dialog";
import { ProjectCard } from "./project-card";

const newCardClass =
  "grid min-h-[118px] place-items-center rounded-card border border-dashed border-border text-accent hover:border-accent";

function ImportButton() {
  const navigate = useNavigate();
  const input = useRef<HTMLInputElement>(null);
  const importZip = useImportProject();

  function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file === undefined) return;
    importZip.mutate(file, {
      onSuccess: (project) => {
        showToast("Project imported");
        void navigate(`/projects/${project.id}/overview`);
      },
    });
  }

  return (
    <>
      <input
        ref={input}
        type="file"
        accept=".zip"
        aria-label="Project zip file"
        className="sr-only"
        tabIndex={-1}
        onChange={handleFile}
      />
      <Button
        disabled={importZip.isPending}
        onClick={() => {
          input.current?.click();
        }}
      >
        Import zip
      </Button>
      {importZip.error === null ? null : <p role="alert">{importZip.error.message}</p>}
    </>
  );
}

/** The projects home: search, import zip, one card per project and the New project dialog. */
export function ProjectsPage() {
  const [params, setParams] = useSearchParams();
  const search = params.get("q") ?? "";
  const projects = useInfiniteQuery(projectsQuery(useDeferredValue(search)));
  const [creating, setCreating] = useState(false);
  const items = toItems(projects.data?.pages);

  return (
    <div className="mx-auto flex w-[min(1040px,100%)] flex-col">
      <PageHeader
        title="Your projects"
        description="Open a project to chat with the assistant or work on its design."
        actions={
          <>
            <Input
              type="search"
              aria-label="Search projects"
              placeholder="Search projects"
              value={search}
              onChange={(event) => {
                setParams(event.target.value === "" ? {} : { q: event.target.value });
              }}
              className="w-52"
            />
            <ImportButton />
          </>
        }
      />
      {projects.isPending ? <p role="status">Loading projects</p> : null}
      {projects.isError ? <p role="alert">{projects.error.message}</p> : null}
      {projects.isSuccess && items.length === 0 ? (
        <p>{search === "" ? "No projects yet. Create the first one." : "No project matches."}</p>
      ) : null}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-3.5">
        {items.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
        <button
          type="button"
          className={newCardClass}
          onClick={() => {
            setCreating(true);
          }}
        >
          + New project
        </button>
      </div>
      {projects.hasNextPage ? (
        <Button
          className="mt-3 self-start"
          disabled={projects.isFetchingNextPage}
          onClick={() => void projects.fetchNextPage()}
        >
          Load more
        </Button>
      ) : null}
      <NewProjectDialog open={creating} onOpenChange={setCreating} />
    </div>
  );
}
