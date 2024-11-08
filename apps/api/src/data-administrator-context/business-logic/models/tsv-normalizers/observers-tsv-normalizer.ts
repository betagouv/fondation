import {
  GSHEET_BLOCK_LINE_BREAK_TOKEN,
  GSHEET_CELL_LINE_BREAK_TOKEN,
} from '../nomination-file-content-reader';

export class ObserversTsvNormalizer {
  static normalize(reportersValue: string): string[] {
    return reportersValue
      .split(GSHEET_BLOCK_LINE_BREAK_TOKEN)
      .map((value) =>
        value.replaceAll(GSHEET_CELL_LINE_BREAK_TOKEN, '\n').trim(),
      );
  }
}
