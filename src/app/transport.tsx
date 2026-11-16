import { Redirect, useLocalSearchParams, type Href } from "expo-router";
import { routesLocation } from "@/logic/routesRoute";

function text(value: string | string[] | undefined): string | null {
  if (typeof value === "string") return value;
  return null;
}

/** Old transport links open Routes and keep the query. */
export default function TransportRedirect() {
  const params = useLocalSearchParams();
  const query: Record<string, string | null> = {};
  for (const [key, value] of Object.entries(params)) query[key] = text(value);
  if (typeof window !== "undefined") {
    const search = new URLSearchParams(window.location.search);
    search.forEach((value, key) => {
      if (!query[key]) query[key] = value;
    });
  }
  return <Redirect href={routesLocation(query) as Href} />;
}
