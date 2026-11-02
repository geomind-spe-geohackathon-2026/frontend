import type { DomainRoutes } from "@/shared/layout/routes";

export const identityRoutes: DomainRoutes = {
  public: [
    {
      path: "/signin",
      lazy: () => import("./authn/page").then((m) => ({ Component: m.SignInPage })),
    },
  ],
  home: [
    {
      path: "/account",
      lazy: () => import("./me/page").then((m) => ({ Component: m.AccountPage })),
    },
  ],
  admin: [
    {
      path: "/users",
      lazy: () => import("./users/page").then((m) => ({ Component: m.UsersPage })),
    },
  ],
};
