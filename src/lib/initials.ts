/** Takes the first letters of the first two words of a name, or the first two letters of a single word, in upper case. */
export function toInitials(name: string): string {
  const words = name.split(/\s+/).filter((word) => word !== "");
  const [only] = words;
  if (words.length === 1 && only !== undefined) return only.slice(0, 2).toUpperCase();
  return words
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
}
