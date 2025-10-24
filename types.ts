
export type DataRow = Record<string, any>;

export interface ExcelData {
  fileName: string;
  headers: string[];
  rows: DataRow[];
}
