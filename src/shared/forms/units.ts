const twins: Record<string, string> = {
  C: "°C",
  degC: "°C",
  "bar(g)": "barg",
  "mPa*s": "mPa.s",
};

/** The units to offer: one spelling of each, and always the one the value already has. */
export function toUnitChoices(units: string[], current: unknown): string[] {
  return units.filter((unit) => {
    const twin = twins[unit];
    return unit === current || twin === undefined || !units.includes(twin);
  });
}
