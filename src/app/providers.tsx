import { QueryClientProvider, type QueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useTheme } from "@/shared/layout/theme";

type Props = { queryClient: QueryClient; children: ReactNode };

/** Wraps the application in the query cache, tooltips and the toast region. */
export function Providers({ queryClient, children }: Props) {
  const [theme] = useTheme();
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>{children}</TooltipProvider>
      <Toaster theme={theme} />
    </QueryClientProvider>
  );
}
