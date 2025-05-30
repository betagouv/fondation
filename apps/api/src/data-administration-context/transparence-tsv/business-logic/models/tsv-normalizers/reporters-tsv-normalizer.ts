import { GSHEET_CELL_LINE_BREAK_TOKEN } from '../nomination-file-content-reader';

export class ReportersTsvNormalizer {
  static normalize(reportersValue: string): string[] {
    return reportersValue
      .split(GSHEET_CELL_LINE_BREAK_TOKEN)
      .map((value) => value.trim());
  }
}
