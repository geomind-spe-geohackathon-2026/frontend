import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ComparePane } from "@/domains/design/results/compare-pane";
import { ResultPane } from "@/domains/design/results/result-pane";
import { resultsQuery } from "@/shared/api/results";
import { Notice } from "@/shared/ui/notice";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";

const compareTab = "compare";

/** The editor's results drawer: one tab per result, newest first, and Compare. */
export function ResultsDrawer({ projectId }: { projectId: string }) {
  const results = useQuery(resultsQuery(projectId));
  const [tab, setTab] = useState<string | null>(null);
  if (results.isPending) return <Notice status="loading" what="results" />;
  if (results.isError) return <Notice status="failed" error={results.error} />;
  const first = results.data[0];
  if (first === undefined) {
    return <Notice status="empty">No results yet. Run a study to get one.</Notice>;
  }
  const selected = tab ?? first.id;
  return (
    <Tabs value={selected} onValueChange={setTab}>
      <TabsList aria-label="Results">
        {results.data.map((entry) => (
          <TabsTrigger key={entry.id} value={entry.id}>
            {entry.name}
          </TabsTrigger>
        ))}
        <TabsTrigger value={compareTab}>Compare</TabsTrigger>
      </TabsList>
      {results.data.map((entry) => (
        <TabsContent key={entry.id} value={entry.id}>
          <ResultPane projectId={projectId} resultId={entry.id} />
        </TabsContent>
      ))}
      <TabsContent value={compareTab}>
        <ComparePane projectId={projectId} results={results.data} />
      </TabsContent>
    </Tabs>
  );
}
