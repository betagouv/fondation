import { readFile } from 'fs/promises';

export class FileReaderProvider {
  async readFromAbsolutePath(absoluteFilePath: string): Promise<string> {
    const file = await readFile(absoluteFilePath);
    return file.toString();
  }
}
