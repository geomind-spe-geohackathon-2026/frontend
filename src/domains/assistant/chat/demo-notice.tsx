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

/** Says that the assistant cannot read an incomplete case, with a link to fill it. */
export function CaseNotice({ projectId }: { projectId: string }) {
  const project = useQuery(projectQuery(projectId));
  const step = project.data?.progress.case;
  if (step?.state !== "incomplete") return null;
  return (
    <p role="status" className="rounded-control border border-warn bg-sunken px-3 py-2">
      The case is incomplete ({step.label}), so the assistant cannot read it yet.{" "}
      <Link to={`/projects/${projectId}/design/case`}>Fill it in</Link>
    </p>
  );
}
