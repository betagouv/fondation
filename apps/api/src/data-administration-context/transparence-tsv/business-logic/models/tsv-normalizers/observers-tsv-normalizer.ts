import {
  GSHEET_BLOCK_LINE_BREAK_TOKEN,
  GSHEET_CELL_LINE_BREAK_TOKEN,
} from '../nomination-file-content-reader';

export class ObserversTsvNormalizer {
  static normalize(reportersValue: string): string[] {
    return reportersValue.split(GSHEET_BLOCK_LINE_BREAK_TOKEN).map((value) =>
      value
        .split(GSHEET_CELL_LINE_BREAK_TOKEN)
        .map((value) => value.trim())
        .join('\n'),
    );
  }
}
