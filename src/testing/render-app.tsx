import { render } from "@testing-library/react";
import { QueryClient } from "@tanstack/react-query";
import { RouterProvider, createMemoryRouter } from "react-router-dom";
import { Providers } from "@/app/providers";
import { routes } from "@/app/router";
import { session } from "@/shared/api/session";
import { exampleAdmin } from "@/mocks/identity";

type Options = { path: string; signedIn?: boolean; user?: string };

/** Renders the whole app at a path with a fresh query client; optionally with a mock session. */
export function renderApp({ path, signedIn = true, user = exampleAdmin.user.id }: Options) {
  if (signedIn) {
    session.set({
      accessToken: `example-access.${user}.0`,
      refreshToken: `example-refresh.${user}.0`,
    });
  }
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <Providers queryClient={queryClient}>
      <RouterProvider router={router} />
    </Providers>,
  );
  return { router, queryClient };
}
