import { Missing } from "@/shared/quantity/missing";
import { Card, CardBody } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import type { MissingValue } from "./types";

type Props = { missing: MissingValue[]; onShow: (path: string) => void };

/** The warning card that lists every missing value with gemini's message and a link to its field. */
export function BlockerBanner({ missing, onShow }: Props) {
  if (missing.length === 0) return null;
  return (
    <Card className="mb-3.5 border-warn" role="region" aria-label="Missing values">
      <CardBody className="flex flex-col gap-2">
        <p className="font-medium">
          {missing.length} {missing.length === 1 ? "value" : "values"} missing
        </p>
        <Missing blocks="studies and results" />
        <ul className="m-0 flex list-none flex-col gap-1 p-0">
          {missing.map((item) => (
            <li key={item.path}>
              <Button
                variant="link"
                onClick={() => {
                  onShow(item.path);
                }}
              >
                {item.path}
              </Button>
              <span className="text-muted"> {item.message}</span>
            </li>
          ))}
        </ul>
      </CardBody>
    </Card>
  );
}
