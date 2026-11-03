import { useEffect, useRef, type ReactNode } from "react";

type Props = { isLocked: boolean; message: string; children: ReactNode };

/** Keeps the plant read-only, with a message that says why, such as a running study. */
export function PlantLock({ isLocked, message, children }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = ref.current;
    if (element === null) return;
    if (isLocked) element.setAttribute("inert", "");
    else element.removeAttribute("inert");
  }, [isLocked]);
  return (
    <div aria-busy={isLocked}>
      {isLocked ? (
        <div
          role="status"
          className="mb-2 rounded-card border border-accent bg-accent-soft px-3 py-1.5"
        >
          {message}
        </div>
      ) : null}
      <div ref={ref} className={isLocked ? "opacity-60" : undefined}>
        {children}
      </div>
    </div>
  );
}
