import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { ChatDock } from "./chat-dock";

type Props = {
  projectId: string;
  chatId: string | null;
  onChat: (chatId: string) => void;
  tab: string;
  onTab: (tab: string) => void;
  onInspector: (element: HTMLElement | null) => void;
};

/** The editor's right panel: the chat, and the inspector of the selected module; both stay mounted. */
export function SidePanel({ projectId, chatId, onChat, tab, onTab, onInspector }: Props) {
  return (
    <Tabs value={tab} onValueChange={onTab}>
      <TabsList aria-label="Side panel">
        <TabsTrigger value="chat">Chat</TabsTrigger>
        <TabsTrigger value="inspect">Inspect</TabsTrigger>
      </TabsList>
      <TabsContent value="chat" forceMount className="data-[state=inactive]:hidden">
        <ChatDock projectId={projectId} chatId={chatId} onChat={onChat} />
      </TabsContent>
      <TabsContent value="inspect" forceMount className="data-[state=inactive]:hidden">
        <div ref={onInspector} />
      </TabsContent>
    </Tabs>
  );
}
