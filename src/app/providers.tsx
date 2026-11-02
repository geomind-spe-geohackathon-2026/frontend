import { QueryClientProvider, type QueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { Toaster } from "@/shared/ui/toast";

type Props = { queryClient: QueryClient; children: ReactNode };

/** Wraps the application in the query cache and the toast region. */
export function Providers({ queryClient, children }: Props) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster />
    </QueryClientProvider>
  );
}
