/** Builds the MSW path pattern for an /api/v1 route, whatever the host. */
export function toRoute(path: string): string {
  return `*/api/v1${path}`;
}

export type NoParams = Record<string, never>;
