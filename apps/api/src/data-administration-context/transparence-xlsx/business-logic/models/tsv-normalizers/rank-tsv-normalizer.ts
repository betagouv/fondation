export class RankTsvNormalizer {
  static normalize(rankValue: string): string {
    const match = rankValue.match(/\((\d+) sur une liste de (\d+)\)$/);
    if (!match) {
      throw new Error(`Invalid rank format: ${rankValue}`);
    }

    return match[0];
  }
}
