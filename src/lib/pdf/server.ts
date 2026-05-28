class FallbackDOMMatrix {
  a = 1;
  b = 0;
  c = 0;
  d = 1;
  e = 0;
  f = 0;
  is2D = true;
  isIdentity = true;

  constructor(init?: number[] | string) {
    if (Array.isArray(init)) {
      [this.a, this.b, this.c, this.d, this.e, this.f] = [
        init[0] ?? 1,
        init[1] ?? 0,
        init[2] ?? 0,
        init[3] ?? 1,
        init[4] ?? 0,
        init[5] ?? 0,
      ];
    }
  }

  multiplySelf() {
    return this;
  }

  preMultiplySelf() {
    return this;
  }

  translateSelf() {
    return this;
  }

  scaleSelf() {
    return this;
  }

  rotateSelf() {
    return this;
  }

  invertSelf() {
    return this;
  }

  transformPoint(point: { x?: number; y?: number; z?: number; w?: number } = {}) {
    return {
      x: point.x ?? 0,
      y: point.y ?? 0,
      z: point.z ?? 0,
      w: point.w ?? 1,
    };
  }
}

class FallbackPath2D {}

class FallbackImageData {
  data: Uint8ClampedArray;
  width: number;
  height: number;

  constructor(widthOrData: number | Uint8ClampedArray, width?: number, height?: number) {
    if (typeof widthOrData === "number") {
      this.width = widthOrData;
      this.height = width ?? 0;
      this.data = new Uint8ClampedArray(this.width * this.height * 4);
      return;
    }

    this.data = widthOrData;
    this.width = width ?? 0;
    this.height = height ?? 0;
  }
}

export async function ensurePdfServerRuntime() {
  if ("DOMMatrix" in globalThis && "Path2D" in globalThis && "ImageData" in globalThis) {
    return;
  }

  const target = globalThis as Record<string, unknown>;
  target.DOMMatrix ??= FallbackDOMMatrix;
  target.Path2D ??= FallbackPath2D;
  target.ImageData ??= FallbackImageData;
}

export async function extractPdfText(buffer: Buffer) {
  await ensurePdfServerRuntime();
  const { PDFParse } = await import("pdf-parse");
  const parser = new PDFParse({ data: buffer });

  try {
    const parsed = await parser.getText();
    return parsed.text.trim();
  } finally {
    await parser.destroy();
  }
}
