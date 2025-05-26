import { EmptyFileError } from '../errors/empty-file.error';
import { FileLengthTooShortError } from '../errors/file-length-too-short.error';

export class TsvParser {
  parse(fileContent: string): [string[], string[], ...string[]] {
    const fileContentLines = fileContent
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (!fileContentLines.length) throw new EmptyFileError();
    if (fileContentLines.length <= 2) {
      throw new FileLengthTooShortError(3, fileContentLines.length);
    }

    const parsedContent = fileContentLines.map((row) =>
      row.split('\t').map((col) => col.trim()),
    );

    return parsedContent as [string[], string[], ...string[]];
  }
}
