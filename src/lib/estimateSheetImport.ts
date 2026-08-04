import type { EstimateSheetState } from '@/types/models';
import { estimateCellKey } from '@/lib/estimateSheetTemplates';

export type EstimateImportDiff = {
  cell: string;
  before: string | number | boolean;
  after: string | number | boolean;
};

export type EstimateImportPreview = {
  templateDetected: boolean;
  templateName: string;
  state: EstimateSheetState;
  diffs: EstimateImportDiff[];
  errors: string[];
};

const UNSAFE_FORMULA = /(?:\[|WEBSERVICE\s*\(|HYPERLINK\s*\(|DDE|CMD\||EXEC\s*\(|CALL\s*\()/i;
const FORMULA_LIKE_TEXT = /^[=+@]|^-[A-Za-z]/;

function scalar(value: unknown): string | number {
  if (value == null) return '';
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === 'string' || typeof value === 'number') return value;
  if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
  if (typeof value === 'object' && value && 'text' in value) return String((value as { text: unknown }).text ?? '');
  if (typeof value === 'object' && value && 'richText' in value) {
    return (value as { richText: Array<{ text?: string }> }).richText.map((item) => item.text || '').join('');
  }
  return String(value);
}

export async function previewEstimateWorkbook(
  buffer: ArrayBuffer,
  fileName: string,
  base: EstimateSheetState,
): Promise<EstimateImportPreview> {
  const errors: string[] = [];
  if (/\.(xlsm|xlam|xlsb)$/i.test(fileName)) {
    return { templateDetected: false, templateName: '', state: base, diffs: [], errors: ['매크로 포함 형식은 가져올 수 없습니다. XLSX 파일을 사용해 주세요.'] };
  }
  const ExcelJS = (await import('exceljs')).default;
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as never);
  const worksheet = workbook.worksheets[0];
  if (!worksheet) return { templateDetected: false, templateName: '', state: base, diffs: [], errors: ['워크시트를 찾을 수 없습니다.'] };

  const templateDetected = worksheet.rowCount <= base.maxRow + 10 && worksheet.columnCount <= base.maxCol + 5;
  if (!templateDetected) errors.push(`템플릿 크기가 일치하지 않습니다: ${worksheet.rowCount}×${worksheet.columnCount}`);
  const next: EstimateSheetState = structuredClone(base);
  const diffs: EstimateImportDiff[] = [];
  const maxRow = Math.min(base.maxRow, worksheet.rowCount);
  const maxCol = Math.min(base.maxCol, worksheet.columnCount);

  for (let row = 1; row <= maxRow; row += 1) {
    for (let column = 1; column <= maxCol; column += 1) {
      const key = estimateCellKey(row, column);
      const excelCell = worksheet.getCell(row, column);
      if (excelCell.isMerged && excelCell.master.address !== excelCell.address) continue;
      const excelValue = excelCell.value;
      let imported: EstimateSheetState['cells'][string];
      if (excelValue && typeof excelValue === 'object' && 'formula' in excelValue) {
        const formula = String((excelValue as { formula?: string }).formula || '').replace(/^=/, '');
        if (!formula || UNSAFE_FORMULA.test(formula)) {
          errors.push(`${worksheet.getCell(row, column).address}: 외부 참조 또는 위험 수식이 차단되었습니다.`);
          continue;
        }
        const existing = next.cells[key];
        imported = existing?.formula === formula
          ? { ...existing }
          : { value: scalar((excelValue as { result?: unknown }).result), formula, userFormula: true, manualOverride: true };
      } else {
        const value = scalar(excelValue);
        if (typeof value === 'string' && FORMULA_LIKE_TEXT.test(value.trim())) {
          errors.push(`${worksheet.getCell(row, column).address}: 수식 주입 가능성이 있는 텍스트가 차단되었습니다.`);
          continue;
        }
        imported = { value, formula: '', userFormula: false, manualOverride: true };
      }
      const before = next.cells[key]?.value ?? '';
      const beforeFormula = next.cells[key]?.formula || '';
      if (before !== imported.value || beforeFormula !== (imported.formula || '')) {
        diffs.push({ cell: worksheet.getCell(row, column).address, before: beforeFormula ? `=${beforeFormula}` : scalar(before), after: imported.formula ? `=${imported.formula}` : scalar(imported.value) });
      }
      next.cells[key] = imported;
    }
  }
  return { templateDetected, templateName: worksheet.name, state: next, diffs, errors };
}
