export class ReportersTsvNormalizer {
  static normalize(...reportersValue: string[]): string[] {
    return [...reportersValue]
      .filter((reporter) => reporter)
      .map((value) => value.trim());
  }
}
