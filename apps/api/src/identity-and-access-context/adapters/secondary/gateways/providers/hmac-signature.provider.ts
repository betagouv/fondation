import { SignatureProvider } from 'src/identity-and-access-context/business-logic/gateways/providers/signature.provider';
import * as cookieSignature from 'cookie-signature';
import { ApiConfig } from 'src/shared-kernel/adapters/primary/zod/api-config-schema';

export class CookieSignatureProvider
  implements Pick<SignatureProvider, 'sign' | 'unsign'>
{
  constructor(private readonly apiConfig: ApiConfig) {}

  sign(value: string): string {
    return cookieSignature.sign(value, this.apiConfig.cookieSecret);
  }

  unsign(value: string): string | false {
    return cookieSignature.unsign(value, this.apiConfig.cookieSecret);
  }
}
