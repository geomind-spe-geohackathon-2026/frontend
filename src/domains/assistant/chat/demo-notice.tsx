import { useQuery } from "@tanstack/react-query";
import { api, toData } from "@/shared/api/client";

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
