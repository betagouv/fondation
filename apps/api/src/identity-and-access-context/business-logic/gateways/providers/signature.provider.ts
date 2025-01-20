export interface SignatureProvider {
  sign(value: string): string;
  unsign(value: string): string | false;
  validateSignature(
    signedValue: string,
    expectedUnsignedValue: string,
  ): boolean;
}
