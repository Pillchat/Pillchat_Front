export function mapWrongNoteResponse(value: any): any {
  if (Array.isArray(value)) return value.map(mapWrongNoteResponse);
  if (!value || typeof value !== "object") return value;
  return {
    ...value,
    ...(typeof value.owner === "boolean" ? { isOwner: value.owner } : {}),
    ...(typeof value.liked === "boolean" ? { isLiked: value.liked } : {}),
    ...(Array.isArray(value.content)
      ? { content: value.content.map(mapWrongNoteResponse) }
      : {}),
    ...(value.data ? { data: mapWrongNoteResponse(value.data) } : {}),
  };
}
