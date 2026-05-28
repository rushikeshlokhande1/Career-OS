declare module "word-extractor" {
  class WordExtractor {
    extract(input: Buffer | string): Promise<{
      getBody(): string;
      getHeaders(): string;
      getFooters(): string;
      getFootnotes(): string;
      getEndnotes(): string;
    }>;
  }

  export default WordExtractor;
}
