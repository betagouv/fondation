import { EncryptionProvider } from 'src/identity-and-access-context/business-logic/gateways/providers/encryption.provider';

type PlainValue = string;
type EncryptedValue = string;

export class FakeEncryptionProvider implements EncryptionProvider {
  encryptionMap: Record<PlainValue, EncryptedValue> = {};

  async comparePasswords(
    password: string,
    encryptedPassword: string,
  ): Promise<boolean> {
    return this.encryptionMap[password] === encryptedPassword;
  }

  async encryptedValue(value: PlainValue): Promise<EncryptedValue> {
    const encryptedValue = this.encryptionMap[value];
    if (!encryptedValue) throw new Error('Value not found in encryption map');
    return encryptedValue;
  }
}
