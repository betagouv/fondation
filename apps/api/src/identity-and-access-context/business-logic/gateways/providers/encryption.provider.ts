export interface EncryptionProvider {
  comparePasswords(password: string, email: string): Promise<boolean>;
  encryptedValue(value: string): Promise<string>;
}
