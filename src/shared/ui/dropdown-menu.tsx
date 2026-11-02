import * as MenuPrimitive from "@radix-ui/react-dropdown-menu";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

/** Menu state holder. */
export const DropdownMenu = MenuPrimitive.Root;

/** The control that opens the menu. */
export const DropdownMenuTrigger = MenuPrimitive.Trigger;

/** A group of radio items sharing one value. */
export const DropdownMenuRadioGroup = MenuPrimitive.RadioGroup;

/** The floating menu panel. */
export function DropdownMenuContent({
  className,
  ...rest
}: ComponentProps<typeof MenuPrimitive.Content>) {
  return (
    <MenuPrimitive.Portal>
      <MenuPrimitive.Content
        align="end"
        sideOffset={6}
        className={cn(
          "z-50 flex min-w-[210px] flex-col rounded-card border border-border bg-surface p-1.5 shadow-float",
          className,
        )}
        {...rest}
      />
    </MenuPrimitive.Portal>
  );
}

const itemClass =
  "rounded-control px-2.5 py-[7px] text-left outline-none data-[highlighted]:bg-sunken";

/** One menu action. */
export function DropdownMenuItem({
  className,
  ...rest
}: ComponentProps<typeof MenuPrimitive.Item>) {
  return <MenuPrimitive.Item className={cn(itemClass, className)} {...rest} />;
}

/** One radio choice inside a radio group. */
export function DropdownMenuRadioItem({
  className,
  ...rest
}: ComponentProps<typeof MenuPrimitive.RadioItem>) {
  return (
    <MenuPrimitive.RadioItem
      className={cn(
        itemClass,
        "data-[state=checked]:font-medium data-[state=checked]:text-accent",
        className,
      )}
      {...rest}
    />
  );
}

/** A small heading inside the menu. */
export function DropdownMenuLabel({
  className,
  ...rest
}: ComponentProps<typeof MenuPrimitive.Label>) {
  return <MenuPrimitive.Label className={cn("px-2.5 py-1.5 text-muted", className)} {...rest} />;
}

/** A divider line inside the menu. */
export function DropdownMenuSeparator() {
  return <MenuPrimitive.Separator className="my-1 h-px bg-border" />;
}
