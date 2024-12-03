import * as crypto from 'crypto';
import {
  S3Commands,
  SseHeaders,
} from 'src/files-context/business-logic/gateways/providers/s3-commands';
import { ApiConfig } from 'src/shared-kernel/adapters/primary/nestia/api-config-schema';

export class ScalewayS3Commands extends S3Commands {
  constructor(readonly apiConfig: ApiConfig) {
    const encryptionKeyBase64 = apiConfig.s3.scaleway.encryptionKeyBase64;

    const encryptionKeyMd5 = crypto
      .createHash('md5')
      .update(encryptionKeyBase64)
      .digest('base64');

    const sseHeaders: SseHeaders = {
      SSECustomerAlgorithm: 'AES256',
      SSECustomerKey: encryptionKeyBase64,
      SSECustomerKeyMD5: encryptionKeyMd5,
    };

    super(sseHeaders);
  }
}
