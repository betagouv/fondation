import { FileType } from '../use-cases/file-read-permission/has-read-file-permission.use-case';

export class FileModel {
  constructor(
    public readonly fileId: string,
    public readonly type: FileType,
  ) {}
}
