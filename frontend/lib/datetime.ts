/** A `<input type="datetime-local">` value is naive local wall-clock; convert it
 * to a UTC ISO string so the backend's UTC date-window checks behave correctly. */
export function toUtcIso(local: string): string | null {
  return local ? new Date(local).toISOString() : null;
}

/** Convert a backend UTC datetime (ISO, possibly without a zone suffix) into a
 * value for a `<input type="datetime-local">` in the user's local timezone. */
export function utcToLocalInput(value: unknown): string {
  if (!value || typeof value !== "string") return "";
  const hasZone = value.endsWith("Z") || /[+-]\d\d:?\d\d$/.test(value);
  const d = new Date(hasZone ? value : value + "Z");
  if (Number.isNaN(d.getTime())) return "";
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}
