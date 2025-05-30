export class PosteCibleTsvNormalizer {
  static normalize(posteCible: string): string {
    return posteCible.replace(/\s*\n\s*/, ' ');
  }
}
