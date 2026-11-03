import { useEffect, useRef, type ReactNode } from "react";

type Props = { isLocked: boolean; children: ReactNode };

/** Keeps the plant read-only while a study runs, so the run and the canvas show the same design. */
export function PlantLock({ isLocked, children }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = ref.current;
    if (element === null) return;
    if (isLocked) element.setAttribute("inert", "");
    else element.removeAttribute("inert");
  }, [isLocked]);
  return (
    <div className="relative" aria-busy={isLocked}>
      <div ref={ref} className={isLocked ? "opacity-60" : undefined}>
        {children}
      </div>
      {isLocked ? (
        <div
          role="status"
          className="absolute inset-x-0 top-2 mx-auto w-fit rounded-card border border-accent bg-accent-soft px-3 py-1.5"
        >
          A study is running. The plant is read-only until it ends.
        </div>
      ) : null}
    </div>
  );
}
