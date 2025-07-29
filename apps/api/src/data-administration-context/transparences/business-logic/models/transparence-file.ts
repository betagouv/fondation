import { Magistrat } from 'shared-models';
import { ApiConfig } from 'src/shared-kernel/adapters/primary/zod/api-config-schema';

export class TransparenceFile {
  constructor(
    readonly file: Express.Multer.File,
    readonly bucket: string,
    readonly path: string[],
  ) {}

  static from(
    dateSession: string,
    formation: Magistrat.Formation,
    name: string,
    file: Express.Multer.File,
    bucket: ApiConfig['s3']['nominationsContext']['transparencesBucketName'],
  ): TransparenceFile {
    const path = [dateSession, formation, name];
    return new TransparenceFile(file, bucket, path);
  }
}
