export class ObserversTsvNormalizer {
  static normalize(observantsValue: string): string[] {
    const emptyObservants = observantsValue.replace(/\s+/g, '') === '';
    if (emptyObservants) return [];

    const observants = observantsValue.split(/\n\s*\n/).map((observant) =>
      observant
        .trim()
        .split('\n')
        .map((ligne) => ligne.trim())
        .join('\n'),
    );

    return observants;
  }
}
