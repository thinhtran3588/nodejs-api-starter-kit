/**
 * Picks specified fields from an object
 * @param obj - The object to pick fields from
 * @param fields - Array of field names to include. If empty or undefined, returns all fields.
 * @returns A new object containing only the specified fields. All requested fields are included,
 *          with undefined values converted to null for JSON compatibility.
 */
export function pickFields<T>(obj: T, fields?: string[]): Partial<T> {
  if (!fields || fields.length === 0) {
    return obj;
  }

  const result: Partial<T> = {} as Partial<T>;
  const objRecord = obj as unknown as Record<string, unknown>;
  const resultRecord = result as unknown as Record<string, unknown>;

  for (const field of fields) {
    if (field in objRecord) {
      const value = objRecord[field];
      // eslint-disable-next-line no-null/no-null -- null is required for JSON serialization
      resultRecord[field] = value === undefined ? null : value;
    } else {
      // eslint-disable-next-line no-null/no-null -- null is required for JSON serialization
      resultRecord[field] = null;
    }
  }
  return result;
}
