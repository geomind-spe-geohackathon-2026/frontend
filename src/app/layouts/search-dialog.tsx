import { useState } from "react";
import { keepPreviousData, useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useMatch, useNavigate } from "react-router-dom";
import { FolderOpen, MessageSquare } from "lucide-react";
import { projectsQuery } from "@/domains/workspace/projects/api";
import { toItems } from "@/shared/api/pagination";
import { useDebouncedValue } from "@/shared/forms/use-debounced-value";
import { chatsQuery } from "@/shared/sse/chats";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

function ChatsGroup({ projectId, onOpen }: { projectId: string; onOpen: (to: string) => void }) {
  const chats = useQuery(chatsQuery(projectId));
  if (chats.data === undefined || chats.data.length === 0) return null;
  return (
    <CommandGroup heading="Chats in this project">
      {chats.data.map((chat) => (
        <CommandItem
          key={chat.id}
          value={`chat ${chat.id} ${chat.title}`}
          onSelect={() => {
            onOpen(`/projects/${projectId}/assistant/chat/${chat.id}`);
          }}
        >
          <MessageSquare aria-hidden="true" />
          {chat.title}
        </CommandItem>
      ))}
    </CommandGroup>
  );
}

/** Search over the projects and the chats of the open project; picking one opens it. */
export function SearchDialog({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const projectId = useMatch("/projects/:projectId/*")?.params.projectId;
  const [term, setTerm] = useState("");
  // The server searches every project; a browser-side filter would see only the first page.
  const search = useDebouncedValue(term.trim(), 250);
  const projects = useInfiniteQuery({ ...projectsQuery(search), placeholderData: keepPreviousData });
  const open = (to: string) => {
    onClose();
    void navigate(to);
  };
  return (
    <CommandDialog
      open
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      title="Search"
      description="Search projects and chats"
    >
      <CommandInput
        value={term}
        onValueChange={setTerm}
        placeholder="Search projects and chats…"
        aria-label="Search projects and chats"
      />
      <CommandList>
        <CommandEmpty>Nothing matches.</CommandEmpty>
        {projectId === undefined ? null : <ChatsGroup projectId={projectId} onOpen={open} />}
        <CommandGroup heading="Projects">
          {toItems(projects.data?.pages).map((project) => (
            <CommandItem
              key={project.id}
              value={`project ${project.id} ${project.name}`}
              onSelect={() => {
                open(`/projects/${project.id}`);
              }}
            >
              <FolderOpen aria-hidden="true" />
              {project.name}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
