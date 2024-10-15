export class TsvParser {
  parse(fileContent: string): string[][] {
    return fileContent.split('\n').map((line) =>
      line
        .split('\t')
        .map((col) => col.trim())
        .filter((col) => col.length > 0),
    );
  }
}
