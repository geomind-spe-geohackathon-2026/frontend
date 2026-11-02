import type { SettingsSchema } from "@/shared/api/design";

export type RawSettings = Record<string, string>;

/** Converts what the user typed into the settings object; an empty field is left out, never defaulted. */
export function toSettings(schema: SettingsSchema, raw: RawSettings): Record<string, unknown> {
  const settings: Record<string, unknown> = {};
  for (const [name, property] of Object.entries(schema.properties ?? {})) {
    const text = raw[name] ?? "";
    if (text === "") continue;
    if (property.type === "number" || property.type === "integer") settings[name] = Number(text);
    else if (property.type === "boolean") settings[name] = text === "true";
    else settings[name] = text;
  }
  return settings;
}

/** Lists the names of required settings that have no value yet. */
export function toUnfilled(schema: SettingsSchema, raw: RawSettings): string[] {
  return (schema.required ?? []).filter((name) => (raw[name] ?? "") === "");
}
