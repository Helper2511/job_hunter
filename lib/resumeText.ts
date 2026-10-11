import "server-only";

/** Extract plain text from a PDF resume, for cover notes and the skills gap. */
export async function extractPdfText(data: Uint8Array): Promise<string | null> {
  try {
    const { extractText, getDocumentProxy } = await import("unpdf");
    const pdf = await getDocumentProxy(data);
    const { text } = await extractText(pdf, { mergePages: true });
    const clean = (Array.isArray(text) ? text.join("\n") : text).replace(/\s+\n/g, "\n").trim();
    return clean ? clean.slice(0, 30_000) : null;
  } catch {
    return null;
  }
}
