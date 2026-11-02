import { isRouteErrorResponse, Link, useRouteError } from "react-router-dom";

function toMessage(error: unknown): string {
  if (isRouteErrorResponse(error)) return `${String(error.status)} ${error.statusText}`;
  if (error instanceof Error) return error.message;
  return "Unknown error";
}

/** The error boundary of the route tree: shows the error and a way back to the projects. */
export function RouteError() {
  const error = useRouteError();
  return (
    <main role="alert" className="flex flex-col items-start gap-2 p-6">
      <h1>Something went wrong</h1>
      <p className="text-muted">{toMessage(error)}</p>
      <Link to="/projects">Back to projects</Link>
    </main>
  );
}
