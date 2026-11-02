export type ApiMode = "mock" | "real";

/** Reads VITE_API_MODE: mock only in the development server, always real in a production build. */
export function toApiMode(value: string | undefined, isDevelopment: boolean): ApiMode {
  if (!isDevelopment) return "real";
  if (value === undefined || value === "mock") return "mock";
  if (value === "real") return "real";
  throw new Error(`VITE_API_MODE must be "mock" or "real", got "${value}"`);
}
