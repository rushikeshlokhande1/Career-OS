import { createRequire } from "module";

type PdfParse = (buffer: Buffer) => Promise<{ text?: string }>;

const require = createRequire(import.meta.url);

export async function extractPdfText(buffer: Buffer) {
  const parse = require("pdf-parse/lib/pdf-parse.js") as PdfParse;
  const parsed = await parse(buffer);

  return parsed.text?.trim() ?? "";
}
