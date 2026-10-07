function normalizeSource(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;

  const source = {
    title: typeof value.title === "string" ? value.title.trim() : "",
    document: typeof value.document === "string" ? value.document.trim() : "",
    section: typeof value.section === "string" ? value.section.trim() : "",
    page: Number.isInteger(value.page) && value.page > 0 ? value.page : null,
    source_type: typeof value.source_type === "string" ? value.source_type.trim() : "",
  };

  if (!source.title && !source.document) return null;
  return source;
}

export function normalizeChatResponse(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("The assistant service returned an invalid response.");
  }

  if (typeof value.answer !== "string" || !value.answer.trim()) {
    throw new Error("The assistant service returned an invalid response.");
  }

  if (!Array.isArray(value.sources) || typeof value.conversation_id !== "string" || !value.conversation_id.trim()) {
    throw new Error("The assistant service returned an invalid response.");
  }

  return {
    answer: value.answer.trim(),
    sources: value.sources.map(normalizeSource).filter(Boolean),
    conversationId: value.conversation_id.trim(),
  };
}
