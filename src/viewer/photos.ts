export interface ViewerPhoto {
  uri: string;
  alt: string;
}

export function viewerPhotos(items: { uri: string; alt?: string | null }[]): ViewerPhoto[] {
  return items
    .filter((item) => item.uri.length > 0)
    .map((item) => ({ uri: item.uri, alt: item.alt?.trim() || "Photo" }));
}

export function imageUrlsIn(text: string): string[] {
  if (!text) return [];
  const found = text.match(/https?:\/\/[^\s<>"']+/gi) ?? [];
  const urls: string[] = [];
  for (const raw of found) {
    const cleaned = raw.replace(/[),.;!?]+$/g, "");
    if (/\.(?:jpe?g|png|gif|webp)(?:\?.*)?$/i.test(cleaned) && !urls.includes(cleaned)) urls.push(cleaned);
  }
  return urls;
}
