export class RankTsvNormalizer {
  static normalize(rankValue: string): string {
    const match = rankValue.match(
      /\(\s*(\d+)\s+sur\s+une\s+liste\s+de\s+(\d+)\s*\)/,
    );
    if (!match) {
      throw new Error(`Invalid rank format: ${rankValue}`);
    }

    return match[0];
  }
}
