import { useInfiniteQuery } from "@tanstack/react-query";
import { useRef, useState, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { toItems } from "@/shared/api/pagination";
import { PageHeader } from "@/shared/layout/page-header";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowUpDown, Search as SearchIcon } from "lucide-react";
import { openMainDialog } from "@/shared/layout/main-dialog";
import type { Project } from "@/shared/api/types";
import { toast } from "sonner";
import { projectsQuery, useImportProject } from "./api";
import { ProjectCard } from "./project-card";
import { Notice } from "@/shared/ui/notice";

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
        toast("Project imported");
        void navigate(`/projects/${project.id}`);
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

type Sort = "updated" | "created" | "name";

const sorts: { value: Sort; label: string }[] = [
  { value: "updated", label: "Last updated" },
  { value: "created", label: "Date created" },
  { value: "name", label: "Alphabetical" },
];

function isSort(value: string): value is Sort {
  return sorts.some((sort) => sort.value === value);
}

function toSorted(items: Project[], sort: Sort): Project[] {
  const copy = [...items];
  if (sort === "name") return copy.sort((a, b) => a.name.localeCompare(b.name));
  return copy.sort((a, b) => Date.parse(b[sort]) - Date.parse(a[sort]));
}

function SearchButton() {
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Search projects"
      title="Search projects"
      onClick={() => {
        openMainDialog("search");
      }}
    >
      <SearchIcon aria-hidden="true" />
    </Button>
  );
}

function SortMenu({ sort, onSort }: { sort: Sort; onSort: (sort: Sort) => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Sort projects" title="Sort projects">
          <ArrowUpDown aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup
          value={sort}
          onValueChange={(value) => {
            if (isSort(value)) onSort(value);
          }}
        >
          {sorts.map((item) => (
            <DropdownMenuRadioItem key={item.value} value={item.value}>
              {item.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** The projects home: the Search dialog and sort icons, import zip, New project, and one card per project. */
export function ProjectsPage() {
  const projects = useInfiniteQuery(projectsQuery(""));
  const [sort, setSort] = useState<Sort>("updated");
  const items = toSorted(toItems(projects.data?.pages), sort);

  return (
    <div className="mx-auto flex w-[min(1040px,100%)] flex-col">
      <PageHeader
        title="Your projects"
        description="Open a project to chat with the assistant or work on its design."
        actions={
          <>
            <SearchButton />
            <SortMenu sort={sort} onSort={setSort} />
            <ImportButton />
            <Button
              variant="default"
              onClick={() => {
                openMainDialog("new");
              }}
            >
              + New project
            </Button>
          </>
        }
      />
      {projects.isPending ? <Notice status="loading" what="projects" /> : null}
      {projects.isError ? <p role="alert">{projects.error.message}</p> : null}
      {projects.isSuccess && items.length === 0 ? (
        <p>No projects yet. Create the first one.</p>
      ) : null}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3">
        {items.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
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
    </div>
  );
}
