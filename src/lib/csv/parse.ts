import Papa from "papaparse";
import * as XLSX from "xlsx";

export type ParsedFile = {
  headers: string[];
  rows: Record<string, string>[];
};

export async function parseFile(file: File): Promise<ParsedFile> {
  const name = file.name.toLowerCase();

  if (name.endsWith(".csv") || name.endsWith(".tsv") || file.type === "text/csv") {
    const text = await file.text();
    const result = Papa.parse<Record<string, string>>(text, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
    });
    const headers = result.meta.fields ?? [];
    return { headers, rows: result.data };
  }

  // .xlsx / .xls
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: "", raw: false });
  const headers = rows.length > 0 ? Object.keys(rows[0]) : [];
  return { headers, rows };
}
