import { FileType } from './file-type';

export class FileModel {
  constructor(
    public readonly fileId: string,
    public readonly type: FileType,
  ) {}
}
