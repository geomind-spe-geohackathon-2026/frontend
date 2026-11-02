import { useEffect, useRef, useState, type ReactNode } from "react";

type Edges = { left: boolean; right: boolean };

const slack = 1;

function toEdges(box: HTMLElement): Edges {
  return {
    left: box.scrollLeft > slack,
    right: box.scrollLeft + box.clientWidth < box.scrollWidth - slack,
  };
}

function useEdges() {
  const box = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState<Edges>({ left: false, right: false });
  useEffect(() => {
    const element = box.current;
    if (element === null) return undefined;
    const update = () => {
      setEdges(toEdges(element));
    };
    update();
    element.addEventListener("scroll", update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(element);
    if (element.firstElementChild !== null) observer.observe(element.firstElementChild);
    return () => {
      element.removeEventListener("scroll", update);
      observer.disconnect();
    };
  }, []);
  return { box, edges };
}

function Fade({ side }: { side: "left" | "right" }) {
  const place = side === "left" ? "left-0 bg-gradient-to-r" : "right-0 bg-gradient-to-l";
  return (
    <span
      aria-hidden="true"
      data-table-fade={side}
      className={`pointer-events-none absolute inset-y-0 w-8 from-sunken to-transparent ${place}`}
    />
  );
}

/** Holds a table that may be wider than its card: it scrolls inside, and a fade marks each edge with more to see. */
export function TableScroll({
  label,
  className = "",
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  const { box, edges } = useEdges();
  const scrolls = edges.left || edges.right;
  return (
    <div className={`relative min-w-0 max-w-full overflow-hidden ${className}`}>
      <div
        ref={box}
        data-table-scroll=""
        className="overflow-x-auto"
        {...(scrolls ? { role: "region", "aria-label": label, tabIndex: 0 } : {})}
      >
        {children}
      </div>
      {edges.left ? <Fade side="left" /> : null}
      {edges.right ? <Fade side="right" /> : null}
    </div>
  );
}
