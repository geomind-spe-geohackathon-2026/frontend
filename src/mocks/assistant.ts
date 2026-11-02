import { http, HttpResponse, type RequestHandler } from "msw";
import type { RunList } from "@/shared/api/types";
import { toRoute } from "./url";

/** Example assistant routes; the runs list is empty until the assistant domain fills it. */
export function assistantHandlers(): RequestHandler[] {
  return [
    http.get(toRoute("/assistant/runs"), () =>
      HttpResponse.json<RunList>({ items: [], next: null }),
    ),
  ];
}
