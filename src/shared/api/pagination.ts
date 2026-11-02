import { infiniteQueryOptions, type QueryKey } from "@tanstack/react-query";

export type Page<T> = { items: T[]; next: string | null };

const firstPage: string | null = null;

/** Builds infinite query options for a contract list that is paged with ?cursor=. */
export function pagedQuery<T>(
  queryKey: QueryKey,
  fetchPage: (cursor: string | null, signal: AbortSignal) => Promise<Page<T>>,
) {
  return infiniteQueryOptions({
    queryKey,
    queryFn: ({ pageParam, signal }) => fetchPage(pageParam, signal),
    initialPageParam: firstPage,
    getNextPageParam: (last) => last.next,
  });
}

/** Joins the loaded pages of an infinite query into one list. */
export function toItems<T>(pages: Page<T>[] | undefined): T[] {
  return pages?.flatMap((page) => page.items) ?? [];
}
