declare module 'exceljs' {
  interface Worksheet {
    [key: string]: any;
    getRow(index: number): Row;
    eachRow(callback: (row: any, rowNumber: number) => void): void;
    columns: any[];
  }

  interface Row {
    values: any[];
    eachCell(callback: (cell: any) => void): void;
    getCell(index: number): any;
  }

  interface Workbook {
    [key: string]: any;
    xlsx: any;
    addWorksheet(name?: string): Worksheet;
    worksheets: Worksheet[];
  }

  interface ExcelJS {
    Workbook: new () => Workbook;
    Worksheet: new () => Worksheet;
  }

  const ExcelJS: ExcelJS;
  export = ExcelJS;
}
