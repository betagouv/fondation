export interface SignatureProvider {
  sign(value: string, secret: string): string;
  unsign(value: string, secret: string): string | false;
}
