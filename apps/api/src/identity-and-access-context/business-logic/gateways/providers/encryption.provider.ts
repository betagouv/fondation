export interface EncryptionProvider {
  encryptedValue(value: string): Promise<string>;
}
