import * as crypto from 'crypto';
import { SignatureProvider } from 'src/identity-and-access-context/business-logic/gateways/providers/signature.provider';
import { ApiConfig } from 'src/shared-kernel/adapters/primary/zod/api-config-schema';

export class SystemRequestSignatureProvider
  implements Pick<SignatureProvider, 'sign' | 'validateSignature'>
{
  static value = 'internal-service';

  constructor(private readonly apiConfig: ApiConfig) {}

  sign(): string {
    return crypto
      .createHmac('sha256', this.apiConfig.sharedSecret)
      .update(SystemRequestSignatureProvider.value)
      .digest('hex');
  }

  validateSignature(signedValue: string): boolean {
    return signedValue === this.sign();
  }
}
