import { DaysStrip } from "@/shared/charts/days-strip";
import { Card, CardBody, CardHeader } from "@/shared/ui/card";
import type { Coverage } from "@/shared/api/types";

const services: { service: Coverage["service"]; label: string }[] = [
  { service: "heating", label: "Heating" },
  { service: "cooling", label: "Cooling" },
];

/** The days-covered strip of each service the plant has a consumer for, or a plain "not available" when gemini could not read coverage. */
export function CoverageCard({ coverage }: { coverage: Coverage[] | null }) {
  const shown = services
    .map((entry) => ({
      ...entry,
      days: (coverage ?? []).filter((day) => day.service === entry.service),
    }))
    .filter((entry) => entry.days.length > 0);
  return (
    <Card className="mb-3.5">
      <CardHeader>
        <h2>Days covered</h2>
      </CardHeader>
      <CardBody>
        {shown.length === 0 ? (
          <p className="text-muted">Daily coverage by source is not available for this result.</p>
        ) : (
          shown.map((entry) => (
            <div key={entry.service} className="mb-3 last:mb-0">
              <h3 className="mb-1 text-[13px] font-semibold">{entry.label}</h3>
              <DaysStrip
                days={entry.days}
                title={`${entry.label}: days covered, one cell per day`}
              />
            </div>
          ))
        )}
      </CardBody>
    </Card>
  );
}
