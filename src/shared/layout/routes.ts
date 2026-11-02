import type { RouteObject } from "react-router-dom";

export type DomainRoutes = {
  public?: RouteObject[];
  home?: RouteObject[];
  admin?: RouteObject[];
  project?: RouteObject[];
};
