declare module 'pdf-parse' {
  interface PDFResult {
    numpages: number;
    numrender: number;
    info: Record<string, unknown>;
    metadata: Record<string, unknown>;
    text: string;
    version: string;
  }

  function pdf(dataBuffer: Buffer, options?: Record<string, unknown>): Promise<PDFResult>;

  export default pdf;
}
