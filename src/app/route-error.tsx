import { useEffect } from "react";
import { isRouteErrorResponse, Link, useRouteError } from "react-router-dom";

function toMessage(error: unknown): string {
  if (isRouteErrorResponse(error)) return `${String(error.status)} ${error.statusText}`;
  if (error instanceof Error) return error.message;
  return "Unknown error";
}

const reloadKey = "geomind-chunk-reload";
const reloadWindowMs = 30_000;

function isStaleBuild(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return /dynamically imported module|Importing a module script failed|error loading dynamically imported module/i.test(
    error.message,
  );
}

function reloadOnce(): boolean {
  try {
    const last = Number(sessionStorage.getItem(reloadKey) ?? "0");
    if (Date.now() - last < reloadWindowMs) return false;
    sessionStorage.setItem(reloadKey, String(Date.now()));
  } catch {
    return false;
  }
  window.location.reload();
  return true;
}

/** The error boundary of the route tree: shows the error and a way back to the projects. */
export function RouteError() {
  const error = useRouteError();
  const stale = isStaleBuild(error);
  useEffect(() => {
    if (stale) reloadOnce();
  }, [stale]);
  return (
    <main role="alert" className="flex flex-col items-start gap-2 p-6">
      <h1>Something went wrong</h1>
      <p className="text-muted">{toMessage(error)}</p>
      <Link to="/projects">Back to projects</Link>
    </main>
  );
}
