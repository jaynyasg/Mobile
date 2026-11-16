/** Old /transport links open Routes and keep the query. */

export function routesLocation(query: Record<string, string | null | undefined> = {}): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (typeof value === "string" && value) params.set(key, value);
  }
  const search = params.toString();
  return search ? `/routes?${search}` : "/routes";
}
