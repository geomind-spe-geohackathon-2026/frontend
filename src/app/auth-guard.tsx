import { useQuery } from "@tanstack/react-query";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { meQuery } from "@/shared/api/me";
import { useSession } from "@/shared/api/session";

/** Layout route: without a session it redirects to /signin and remembers the target in the URL. */
export function AuthGuard() {
  const tokens = useSession();
  const location = useLocation();
  if (tokens !== null) return <Outlet />;
  const next = encodeURIComponent(location.pathname + location.search);
  return <Navigate to={`/signin?next=${next}`} replace />;
}

/** Layout route: only admins see the pages inside; everyone else gets a permission message. */
export function AdminGuard() {
  const me = useQuery(meQuery());
  if (me.isPending) return <p className="p-6 text-muted">Loading</p>;
  if (me.isError)
    return (
      <p role="alert" className="p-6 text-bad">
        {me.error.message}
      </p>
    );
  if (me.data.role !== "admin") {
    return (
      <div role="alert" className="p-6">
        <h1>No permission</h1>
        <p className="mt-1 text-muted">Only admins can open this page.</p>
      </div>
    );
  }
  return <Outlet />;
}
