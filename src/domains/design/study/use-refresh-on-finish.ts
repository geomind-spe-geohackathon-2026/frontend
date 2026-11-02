import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";

/** Refreshes everything of the project (progress dots, results, overview) when its studies stop being active. */
export function useRefreshOnFinish(projectId: string, isActive: boolean): void {
  const queryClient = useQueryClient();
  const wasActive = useRef(false);
  useEffect(() => {
    if (wasActive.current && !isActive) {
      void queryClient.invalidateQueries({ queryKey: ["projects", projectId] });
    }
    wasActive.current = isActive;
  }, [isActive, projectId, queryClient]);
}
