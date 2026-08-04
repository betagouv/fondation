import { ArgumentMetadata, BadRequestException, PipeTransform } from '@nestjs/common';

export class ParseBigIntPipe implements PipeTransform<string, bigint> {
  transform(value: string, metadata: ArgumentMetadata): bigint {
    try {
      return BigInt(value);
    } catch {
      throw new BadRequestException(
        `Validation failed (numeric string is expected for ${metadata.data ?? 'value'})`,
      );
    }
  }
}
