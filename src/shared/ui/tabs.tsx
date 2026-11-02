import * as TabsPrimitive from "@radix-ui/react-tabs";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

/** Tab group; controlled through value and onValueChange. */
export const Tabs = TabsPrimitive.Root;

/** The row of tab triggers. */
export function TabsList({ className, ...rest }: ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List className={cn("mb-3.5 flex flex-wrap gap-1.5", className)} {...rest} />
  );
}

/** One tab trigger, drawn as a pill. */
export function TabsTrigger({ className, ...rest }: ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        "rounded-pill border border-border bg-surface px-3 py-1 text-[12.5px] data-[state=active]:border-text data-[state=active]:bg-text data-[state=active]:text-surface",
        className,
      )}
      {...rest}
    />
  );
}

/** The content of one tab. */
export const TabsContent = TabsPrimitive.Content;
