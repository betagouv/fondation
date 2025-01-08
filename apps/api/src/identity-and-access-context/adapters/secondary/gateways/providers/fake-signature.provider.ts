import { SignatureProvider } from 'src/identity-and-access-context/business-logic/gateways/providers/signature.provider';

type SignedValue = string;
type OriginalValue = string;

export class FakeSignatureProvider implements SignatureProvider {
  signedValuesMap: Record<SignedValue, OriginalValue> = {};
  nextSignedValue: string;

  sign(value: string): string {
    if (!this.nextSignedValue) throw new Error('No next signed value');
    const signedValue = this.nextSignedValue;
    this.signedValuesMap[signedValue] = value;
    return signedValue;
  }

  unsign(signedValue: string): string | false {
    const originalValue = this.signedValuesMap[signedValue];
    return originalValue ? originalValue : false;
  }
}
