import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api, toData, toFormData } from "@/shared/api/client";
import { isRecord } from "@/shared/forms/json-schema";
import { Button } from "@/shared/ui/button";
import { showToast } from "@/shared/ui/toast";

type Props = { projectId: string; chatId: string };

function findFiles(node: unknown): string[] {
  if (typeof node === "string") return node.endsWith(".csv") ? [node] : [];
  if (Array.isArray(node)) return node.flatMap(findFiles);
  return isRecord(node) ? Object.values(node).flatMap(findFiles) : [];
}

async function readChatCase(chatId: string): Promise<Record<string, unknown>> {
  const { state } = toData(
    await api.GET("/assistant/chat/{chat_id}/state", { params: { path: { chat_id: chatId } } }),
  );
  if (!isRecord(state) || !isRecord(state.case)) throw new Error("This chat has no case");
  return state.case;
}

async function readChatFile(chatId: string, name: string): Promise<Blob> {
  return toData(
    await api.GET("/assistant/chat/{chat_id}/files/{name}", {
      params: { path: { chat_id: chatId, name } },
      parseAs: "blob",
    }),
  );
}

async function addToCase(projectId: string, chatId: string): Promise<number> {
  const content = await readChatCase(chatId);
  const saved = toData(
    await api.GET("/design/case", { params: { query: { project: projectId } } }),
  );
  const known = new Set(saved.files.map((file) => file.name));
  let base = saved.version;
  for (const name of new Set(findFiles(content))) {
    if (known.has(name)) continue;
    const file = await readChatFile(chatId, name);
    const body = { project: projectId, base, name, file };
    const stored = toData(
      await api.POST("/design/case/files", {
        body,
        bodySerializer: () => toFormData({ ...body, file: new File([file], name) }),
      }),
    );
    base = stored.version;
  }
  const case_ = await api.POST("/design/case", {
    body: { project: projectId, base, note: "From the chat", content },
  });
  return toData(case_).version;
}

/** Offers to save the case this chat changed as a new version of the project's case. */
export function AddToCase({ projectId, chatId }: Props) {
  const queryClient = useQueryClient();
  const [failure, setFailure] = useState<string | null>(null);
  const add = useMutation({
    mutationFn: () => addToCase(projectId, chatId),
    onSuccess: async (version) => {
      setFailure(null);
      showToast(`Case v${String(version)} saved`);
      await queryClient.invalidateQueries({ queryKey: ["projects", projectId] });
    },
    onError: (error) => {
      setFailure(error.message);
    },
  });
  return (
    <div className="flex items-center gap-2">
      <Button
        disabled={add.isPending}
        onClick={() => {
          add.mutate();
        }}
      >
        Add to Case
      </Button>
      <span className="text-[12.5px] text-muted">
        {failure ?? "The profile is in this chat only until you add it."}
      </span>
    </div>
  );
}
