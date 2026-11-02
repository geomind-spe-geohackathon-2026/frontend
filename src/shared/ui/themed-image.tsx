import { useState } from "react";
import { useTheme } from "@/shared/layout/theme";

const svgPrefix = "data:image/svg+xml;base64,";
const tokens: Record<string, string> = {
  "#ffffff": "--surface",
  "#f1f4f7": "--sunken",
  "#17212b": "--text",
  "#5b6977": "--muted",
  "#d3dae1": "--border",
};

function toText(data: string): string {
  return new TextDecoder().decode(Uint8Array.from(atob(data), (char) => char.charCodeAt(0)));
}

/** Gives a light SVG the colours of the current theme, from the page's own tokens. */
export function toThemedSvg(svg: string): string {
  const style = getComputedStyle(document.documentElement);
  return Object.entries(tokens).reduce((text, [colour, token]) => {
    const value = style.getPropertyValue(token).trim();
    return value === "" ? text : text.replaceAll(colour, value);
  }, svg);
}

function toImageUrl(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(toThemedSvg(svg))}`;
}

/** Reads the SVG of a data link, or nothing for any other link. */
export function fromSvgUrl(src: string | undefined): string | null {
  return src?.startsWith(svgPrefix) === true ? toText(src.slice(svgPrefix.length)) : null;
}

/** An SVG figure in the theme of the page; a wide one opens larger on a click. */
export function ThemedImage({
  svg,
  alt,
  zoom = false,
}: {
  svg: string;
  alt: string;
  zoom?: boolean;
}) {
  const [theme] = useTheme();
  const [open, setOpen] = useState(false);
  const image = <img key={theme} src={toImageUrl(svg)} alt={alt} className="w-full" />;
  if (!zoom) return image;
  return (
    <>
      <button
        type="button"
        aria-label={`Enlarge: ${alt}`}
        className="w-full cursor-zoom-in"
        onClick={() => {
          setOpen(true);
        }}
      >
        {image}
      </button>
      {open ? (
        <button
          type="button"
          aria-label="Close the figure"
          className="fixed inset-0 z-50 flex cursor-zoom-out items-center bg-surface p-6"
          onClick={() => {
            setOpen(false);
          }}
        >
          {image}
        </button>
      ) : null}
    </>
  );
}
