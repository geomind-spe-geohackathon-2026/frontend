import * as DialogPrimitive from "@radix-ui/react-dialog";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Dialog state holder; controlled through open and onOpenChange. */
export const Dialog = DialogPrimitive.Root;

/** Opens the dialog from the wrapped control. */
export const DialogTrigger = DialogPrimitive.Trigger;

/** Closes the dialog from the wrapped control. */
export const DialogClose = DialogPrimitive.Close;

type Props = ComponentProps<typeof DialogPrimitive.Content> & {
  title: string;
  children: ReactNode;
};

/** A modal dialog with a title, focus trap and Escape to close. */
export function DialogContent({ title, children, className, ...rest }: Props) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-black/45" />
      <DialogPrimitive.Content
        aria-describedby={undefined}
        className={cn(
          "fixed top-1/2 left-1/2 z-50 flex w-[min(460px,calc(100%-32px))] -translate-x-1/2 -translate-y-1/2 flex-col gap-3 rounded-dialog bg-surface p-[18px] shadow-float",
          className,
        )}
        {...rest}
      >
        <DialogPrimitive.Title>{title}</DialogPrimitive.Title>
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
