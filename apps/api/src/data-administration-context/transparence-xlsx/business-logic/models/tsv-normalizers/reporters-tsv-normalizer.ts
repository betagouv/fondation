export class ReportersTsvNormalizer {
  static normalize(reportersValue: string): string[] {
    const reporters = reportersValue
      .split('\n')
      .map((value) => value.trim())
      .filter((value) => value.length > 0)
      .filter((value) => !value.match(/changement\s*de\s*rapporteur/i));

    if (reporters.length > 3) {
      throw new Error(`Too many reporters: ${reportersValue}`);
    }

    return reporters;
  }
}
