import { SEPARATOR_LINE_BREAK } from 'src/data-administration-context/transparence-xlsx/business-logic/models/nomination-file-content-reader';

export class ReportersTsvNormalizer {
  static normalize(reportersValue: string): string[] {
    const reporters = reportersValue
      .split(SEPARATOR_LINE_BREAK)
      .map((value) => value.trim())
      .filter((value) => value.length > 0)
      .filter((value) => !value.match(/changement\s*de\s*rapporteur/i));

    if (reporters.length > 3) {
      throw new Error(`Too many reporters: ${reportersValue}`);
    }

    return reporters;
  }
}
