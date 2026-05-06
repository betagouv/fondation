import { InternalServerErrorException, Logger } from '@nestjs/common';

const logger = new Logger('PgParams');
export function assertPgParams(params: { length: number } | { size: number }): asserts params {
  const length = 'length' in params ? params.length : params.size;
  if (length > 32_700) {
    logger.warn(`${length} params provided, 32,700 max accepted`);
    throw new InternalServerErrorException();
  }
}
