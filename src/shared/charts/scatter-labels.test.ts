import { describe, expect, it } from "vitest";
import { toLabelPlaces, type LabelPoint } from "./scatter-labels";

const bounds = { left: 64, right: 876, top: 16, bottom: 312 };

function toTextBox(point: LabelPoint, places: ReturnType<typeof toLabelPlaces>) {
  const place = places.get(point.id);
  if (place === undefined) throw new Error("a point has no label");
  const width = point.label.length * 6.2;
  const left = place.anchor === "start" ? place.x : place.x - width;
  return { left, right: left + width, top: place.y - 10, bottom: place.y + 3 };
}

describe("toLabelPlaces", () => {
  it("keeps labels of close points apart", () => {
    const points = ["Design one", "Design two", "Design three", "Design four"].map((label, at) => ({
      id: label,
      label,
      x: 400 + at * 6,
      y: 160 + at * 4,
    }));
    const boxes = points.map((point) => toTextBox(point, toLabelPlaces(points, bounds)));
    boxes.forEach((first, index) => {
      for (const second of boxes.slice(index + 1)) {
        const apart =
          first.right <= second.left ||
          second.right <= first.left ||
          first.bottom <= second.top ||
          second.bottom <= first.top;
        expect(apart).toBe(true);
      }
    });
  });

  it("keeps a label at the right edge inside the plot", () => {
    const point = { id: "a", label: "A long design name", x: 870, y: 160 };
    const box = toTextBox(point, toLabelPlaces([point], bounds));
    expect(box.right).toBeLessThanOrEqual(bounds.right);
  });
});
