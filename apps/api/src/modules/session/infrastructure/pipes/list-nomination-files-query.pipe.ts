import { ArgumentMetadata, PipeTransform } from '@nestjs/common';

export class ListNominationFilesQueryPipe implements PipeTransform {
  async transform(value: any, metadata: ArgumentMetadata) {
    const { metatype } = metadata;
    try {
      return (metatype as any).schema.parse(value);
    } catch (e) {
      console.error(e);
    }

    return null;
  }
}
