import { DaysStrip } from "@/shared/charts/days-strip";
import { Card, CardBody, CardHeader } from "@/shared/ui/card";
import type { CoverageDay } from "@/shared/api/design";

/** The days-covered strip, or a plain "not available" when gemini has not published coverage. */
export function CoverageCard({ coverage }: { coverage: CoverageDay[] | null }) {
  return (
    <Card className="mb-3.5">
      <CardHeader>
        <h2>Days covered</h2>
      </CardHeader>
      <CardBody>
        {coverage === null ? (
          <p className="text-muted">Daily coverage by source is not available for this result.</p>
        ) : (
          <DaysStrip days={coverage} title="Days covered, one cell per day" />
        )}
      </CardBody>
    </Card>
  );
}
