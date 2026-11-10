/** Client-side mirror of public.community_can_participate. Signed-in users may take part. */
export function canParticipate(userId: string | null | undefined): boolean {
  return typeof userId === "string" && userId.length > 0;
}

export function canModerate(staff: boolean): boolean {
  return staff;
}

export function canRemove(authorId: string, actorId: string, staff: boolean): boolean {
  return authorId === actorId || staff;
}
