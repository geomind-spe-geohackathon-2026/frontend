import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { PlantPage } from "@/domains/design/plant/page";
import { useRequiredParam } from "@/shared/layout/params";
import { ModuleResults } from "./module-results";
import { PlantChangeNotice, usePlantChange } from "./plant-change-notice";
import { PlantLock, useInert } from "./plant-lock";
import { ResultsDrawer } from "./results-drawer";
import { RunBar } from "./run-bar";
import { SidePanel } from "./side-panel";
import { useActiveStudy } from "./use-active-study";
import { useWideScreen } from "./use-wide-screen";

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
    selected: params.get("module"),
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

function toLockMessage(isRunning: boolean): string {
  if (isRunning) return "A study is running. The plant is read-only until it ends.";
  return "Read-only on a phone. Edit the plant on a larger screen, or ask in the chat.";
}

function useSideTab(selected: string | null) {
  const [tab, setTab] = useState("chat");
  const previous = useRef<string | null>(null);
  useEffect(() => {
    if (selected !== null && selected !== previous.current) setTab("inspect");
    previous.current = selected;
  }, [selected]);
  return [tab, setTab] as const;
}

function useInspector(selected: string | null, isLocked: boolean) {
  const [element, setElement] = useState<HTMLElement | null>(null);
  const [tab, setTab] = useSideTab(selected);
  useInert(element, isLocked);
  return { element, setElement, tab, setTab };
}

function DrawerSection({ projectId }: { projectId: string }) {
  return (
    <section
      aria-label="Results drawer"
      className="max-h-[40%] shrink-0 overflow-auto rounded-card border border-border bg-surface p-3 max-[1000px]:max-h-none"
    >
      <ResultsDrawer projectId={projectId} />
    </section>
  );
}

/** The Editor: plant, chat dock and results drawer on one screen, with the study toolbar on top. */
export function EditorPage() {
  const projectId = useRequiredParam("projectId");
  const { selected, chatId, panels, setChat, setPanels, showHistory, selectModule } =
    useEditorParams();
  const isRunning = useActiveStudy(projectId);
  const isWide = useWideScreen();
  const isLocked = isRunning || !isWide;
  const inspector = useInspector(selected, isLocked);
  const change = usePlantChange(projectId);
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
      <PlantChangeNotice change={change} onHistory={showHistory} />
      {isRunning ? null : <ModuleResults projectId={projectId} onModule={selectModule} />}
      <div className="flex min-h-0 flex-1 gap-3 max-[1000px]:flex-col">
        <section aria-label="Plant" className="@container min-w-0 flex-1 overflow-auto">
          <PlantLock isLocked={isLocked} message={toLockMessage(isRunning)}>
            <PlantPage
              embed={{
                inspector: panels.chat ? inspector.element : null,
                changed: change?.changed,
              }}
            />
          </PlantLock>
        </section>
        {panels.chat ? (
          <aside
            aria-label="Side panel"
            className="w-[360px] shrink-0 overflow-auto rounded-card border border-border bg-surface p-3 max-[1000px]:w-auto"
          >
            <SidePanel
              projectId={projectId}
              chatId={chatId}
              onChat={setChat}
              tab={inspector.tab}
              onTab={inspector.setTab}
              onInspector={inspector.setElement}
            />
          </aside>
        ) : null}
      </div>
      {panels.results ? <DrawerSection projectId={projectId} /> : null}
    </div>
  );
}
