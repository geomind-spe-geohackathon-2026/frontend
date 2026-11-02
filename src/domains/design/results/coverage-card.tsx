import { DaysStrip } from "@/shared/charts/days-strip";
import { Card, CardBody, CardHeader } from "@/shared/ui/card";
import type { Coverage } from "@/shared/api/types";

const services = [
  { key: "heating", label: "Heating", main: "Geothermal" },
  { key: "cooling", label: "Cooling", main: "Plant" },
] as const;

/** The days-covered strip of each service, or a plain "not available" when gemini has not published coverage. */
export function CoverageCard({ coverage }: { coverage: Coverage | null }) {
  return (
    <Card className="mb-3.5">
      <CardHeader>
        <h2>Days covered</h2>
      </CardHeader>
      <CardBody>
        {coverage === null ? (
          <p className="text-muted">
            Made before daily coverage existed. Run the study again to get it.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {services.map(({ key, label, main }) => (
              <section key={key} aria-label={label} className="flex flex-col gap-1.5">
                <h3 className="text-[12.5px] text-muted">{label}</h3>
                <DaysStrip
                  days={coverage[key]}
                  title={`${label}, one cell per day`}
                  mainLabel={main}
                />
              </section>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
