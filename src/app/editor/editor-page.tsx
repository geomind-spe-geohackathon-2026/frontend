import { useSearchParams } from "react-router-dom";
import { PlantPage } from "@/domains/design/plant/page";
import { useRequiredParam } from "@/shared/layout/params";
import { ChatDock } from "./chat-dock";
import { ModuleResults } from "./module-results";
import { PlantChangeNotice } from "./plant-change-notice";
import { PlantLock } from "./plant-lock";
import { ResultsDrawer } from "./results-drawer";
import { RunBar } from "./run-bar";
import { useActiveStudy } from "./use-active-study";

const chatKey = "chat";
const panelsKey = "panels";

function toPanels(value: string | null): { chat: boolean; results: boolean } {
  if (value === null) return { chat: true, results: false };
  const names = value.split(",");
  return { chat: names.includes("chat"), results: names.includes("results") };
}

function toPanelsValue(panels: { chat: boolean; results: boolean }): string {
  return [panels.chat ? "chat" : null, panels.results ? "results" : null]
    .filter((name) => name !== null)
    .join(",");
}

function useEditorParams() {
  const [params, setParams] = useSearchParams();
  const panels = toPanels(params.get(panelsKey));
  const update = (key: string, value: string) => {
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        next.set(key, value);
        return next;
      },
      { replace: true },
    );
  };
  return {
    chatId: params.get(chatKey),
    panels,
    setChat: (chatId: string) => {
      update(chatKey, chatId);
    },
    setPanels: (next: { chat: boolean; results: boolean }) => {
      update(panelsKey, toPanelsValue(next));
    },
    showHistory: () => {
      update("tab", "history");
    },
    selectModule: (id: string) => {
      update("module", id);
    },
  };
}

/** The Editor: plant, chat dock and results drawer on one screen, with the study toolbar on top. */
export function EditorPage() {
  const projectId = useRequiredParam("projectId");
  const { chatId, panels, setChat, setPanels, showHistory, selectModule } = useEditorParams();
  const isRunning = useActiveStudy(projectId);
  return (
    <div className="flex min-h-[560px] flex-col gap-3 min-[1000px]:h-[calc(100dvh-86px)]">
      <RunBar
        projectId={projectId}
        isChatOpen={panels.chat}
        isResultsOpen={panels.results}
        onToggleChat={() => {
          setPanels({ ...panels, chat: !panels.chat });
        }}
        onToggleResults={() => {
          setPanels({ ...panels, results: !panels.results });
        }}
        onStudyEnded={() => {
          setPanels({ ...panels, results: true });
        }}
      />
      <PlantChangeNotice projectId={projectId} onHistory={showHistory} />
      {isRunning ? null : <ModuleResults projectId={projectId} onModule={selectModule} />}
      <div className="flex min-h-0 flex-1 gap-3 max-[1000px]:flex-col">
        <section aria-label="Plant" className="@container min-w-0 flex-1 overflow-auto">
          <PlantLock isLocked={isRunning}>
            <PlantPage />
          </PlantLock>
        </section>
        {panels.chat ? (
          <aside
            aria-label="Chat dock"
            className="w-[360px] shrink-0 overflow-auto rounded-card border border-border bg-surface p-3 max-[1000px]:w-auto"
          >
            <ChatDock projectId={projectId} chatId={chatId} onChat={setChat} />
          </aside>
        ) : null}
      </div>
      {panels.results ? (
        <section
          aria-label="Results drawer"
          className="max-h-[40%] shrink-0 overflow-auto rounded-card border border-border bg-surface p-3 max-[1000px]:max-h-none"
        >
          <ResultsDrawer projectId={projectId} />
        </section>
      ) : null}
    </div>
  );
}
