import { SignatureProvider } from 'src/identity-and-access-context/business-logic/gateways/providers/signature.provider';
import * as cookieSignature from 'cookie-signature';

export class HmacSignatureProvider implements SignatureProvider {
  constructor() {}

  sign(value: string, secret: string): string {
    return cookieSignature.sign(value, secret);
  }

  unsign(value: string, secret: string): string | false {
    return cookieSignature.unsign(value, secret);
  }
}
