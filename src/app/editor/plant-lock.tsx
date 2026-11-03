import { useEffect, useState, type ReactNode } from "react";

type Props = { isLocked: boolean; message: string; children: ReactNode };

/** Makes an element and what is inside it unreachable while locked. */
export function useInert(element: HTMLElement | null, isLocked: boolean): void {
  useEffect(() => {
    if (element === null) return;
    if (isLocked) element.setAttribute("inert", "");
    else element.removeAttribute("inert");
  }, [element, isLocked]);
}

/** Keeps the plant read-only, with a message that says why, such as a running study. */
export function PlantLock({ isLocked, message, children }: Props) {
  const [element, setElement] = useState<HTMLDivElement | null>(null);
  useInert(element, isLocked);
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
      <div ref={setElement} className={isLocked ? "opacity-60" : undefined}>
        {children}
      </div>
    </div>
  );
}
