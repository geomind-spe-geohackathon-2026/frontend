import { useParams } from "react-router-dom";

/** Reads a route parameter that the route definition guarantees; a missing one is a programming error. */
export function useRequiredParam(name: string): string {
  const value = useParams()[name];
  if (value === undefined || value === "") throw new Error(`Route parameter "${name}" is missing`);
  return value;
}
