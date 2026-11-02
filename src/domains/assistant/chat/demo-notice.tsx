import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api, toData } from "@/shared/api/client";
import { projectQuery } from "@/shared/api/projects";

/** Says that the assistant plays scripted replies because no model is connected. */
export function DemoNotice() {
  const health = useQuery({
    queryKey: ["system", "health"],
    queryFn: async () => toData(await api.GET("/system/health")),
  });
  if (health.data?.assistant !== "scripted") return null;
  return (
    <p role="status" className="rounded-control border border-warn bg-sunken px-3 py-2">
      Demo mode: scripted replies, no model connected
    </p>
  );
}

/** Says that the case is incomplete: the user can tell the assistant or fill it in by hand. */
export function CaseNotice({ projectId }: { projectId: string }) {
  const project = useQuery(projectQuery(projectId));
  const step = project.data?.progress.case;
  if (step?.state !== "incomplete") return null;
  return (
    <p role="status" className="rounded-control border border-warn bg-sunken px-3 py-2">
      The case still has missing values. Tell the assistant, or{" "}
      <Link to={`/projects/${projectId}/design/case`}>fill them in yourself</Link>.
    </p>
  );
}
