export const communityLimits = {
  post: 2000,
  comment: 1000,
  message: 1000,
  name: 80,
  title: 80,
  company: 80,
  report: 500,
  perMinute: 8,
} as const;

export function assertLength(value: string, max: number, label: string): string {
  const trimmed = value.trim();
  if (!trimmed) throw new Error(`${label} is empty`);
  if (trimmed.length > max) throw new Error(`${label} is too long`);
  return trimmed;
}
