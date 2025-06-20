export class ObserversTsvNormalizer {
  static normalize(observantsValue: string): string[] {
    const observants = observantsValue.split(/\n\s*\n/).map((observant) =>
      observant
        .split('\n')
        .map((ligne) => ligne.trim())
        .join('\n'),
    );

    return observants;
  }
}
