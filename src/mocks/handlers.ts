import type { RequestHandler } from "msw";
import { assistantHandlers } from "./assistant";
import { caseHandlers } from "./case";
import { identityHandlers } from "./identity";
import { pendingHandlers } from "./connectors";
import { plantHandlers } from "./plant";
import { reportHandlers } from "./report";
import { resultsHandlers } from "./results";
import { studyHandlers } from "./study";
import { workspaceHandlers } from "./workspace";

/** Creates fresh handlers with fresh in-memory state: one line per domain file. */
export function createHandlers(): RequestHandler[] {
  return [
    ...identityHandlers(),
    ...workspaceHandlers(),
    ...assistantHandlers(),
    ...caseHandlers(),
    ...plantHandlers(),
    ...studyHandlers(),
    ...resultsHandlers(),
    ...reportHandlers(),
    ...pendingHandlers(),
  ];
}
