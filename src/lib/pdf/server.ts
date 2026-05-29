import PDFParser from "pdf2json";

type PdfParserError = { parserError?: Error } | Error;

export async function extractPdfText(buffer: Buffer) {
  return new Promise<string>((resolve, reject) => {
    const parser = new PDFParser(null, true);

    parser.once("pdfParser_dataError", (error: PdfParserError) => {
      parser.destroy();
      reject(error instanceof Error ? error : error.parserError ?? new Error("PDF parsing failed."));
    });

    parser.once("pdfParser_dataReady", () => {
      const text = parser.getRawTextContent().trim();
      parser.destroy();
      resolve(text);
    });

    parser.parseBuffer(buffer);
  });
}
