export type LabelPoint = { id: string; label: string; x: number; y: number };
export type LabelPlace = { x: number; y: number; anchor: "start" | "end" };
export type LabelBounds = { left: number; right: number; top: number; bottom: number };

const characterWidth = 6.2;
const lineHeight = 13;
const gap = 9;
const maximumSteps = 12;

type Box = { left: number; right: number; top: number; bottom: number };

function toBox(point: LabelPoint, place: LabelPlace): Box {
  const width = point.label.length * characterWidth;
  const left = place.anchor === "start" ? place.x : place.x - width;
  return { left, right: left + width, top: place.y - lineHeight + 3, bottom: place.y + 3 };
}

function overlaps(first: Box, second: Box): boolean {
  return (
    first.left < second.right &&
    second.left < first.right &&
    first.top < second.bottom &&
    second.top < first.bottom
  );
}

function isInside(box: Box, bounds: LabelBounds): boolean {
  return (
    box.left >= bounds.left &&
    box.right <= bounds.right &&
    box.top >= bounds.top &&
    box.bottom <= bounds.bottom
  );
}

function toPlaces(point: LabelPoint): LabelPlace[] {
  const steps = Array.from({ length: maximumSteps }, (_, index) => index);
  return steps.flatMap((step) => {
    const lift = gap + step * lineHeight;
    return [
      { x: point.x + gap, y: point.y - lift + lineHeight / 2, anchor: "start" as const },
      { x: point.x + gap, y: point.y + lift, anchor: "start" as const },
      { x: point.x - gap, y: point.y - lift + lineHeight / 2, anchor: "end" as const },
      { x: point.x - gap, y: point.y + lift, anchor: "end" as const },
    ];
  });
}

function toDotBox(point: LabelPoint): Box {
  return {
    left: point.x - gap,
    right: point.x + gap,
    top: point.y - gap,
    bottom: point.y + gap,
  };
}

/** Places each label beside its point, clear of the other labels and points and inside the plot. */
export function toLabelPlaces(points: LabelPoint[], bounds: LabelBounds): Map<string, LabelPlace> {
  const taken = points.map(toDotBox);
  const places = new Map<string, LabelPlace>();
  const ordered = [...points].sort((first, second) => first.x - second.x);
  for (const point of ordered) {
    const options = toPlaces(point);
    const clear = options.find((place) => {
      const box = toBox(point, place);
      return isInside(box, bounds) && !taken.some((other) => overlaps(box, other));
    });
    const place = clear ?? options[0];
    if (place === undefined) continue;
    places.set(point.id, place);
    taken.push(toBox(point, place));
  }
  return places;
}
