import { Transparence } from 'src/data-administration-context/transparence-xlsx/business-logic/models/transparence';
import { ApiConfig } from 'src/shared-kernel/adapters/primary/zod/api-config-schema';

export class TransparenceFile {
  constructor(
    readonly fileId: string,
    readonly file: Express.Multer.File,
    readonly bucket: string,
    readonly path: string[],
  ) {}
}

export class TransparenceFileBuilder {
  constructor(
    private readonly _fileId: string,
    private readonly _file: Express.Multer.File,
    private readonly _bucket: string,
    private readonly _apiConfig: ApiConfig,
  ) {
    this._bucket =
      this._apiConfig.s3.nominationsContext.transparencesBucketName;
  }

  from(transparence: Transparence): TransparenceFile {
    const path = [
      transparence.dateTransparence,
      transparence.formation,
      transparence.name,
    ];

    return new TransparenceFile(this._fileId, this._file, this._bucket, path);
  }
}
