import { EncryptionProvider } from 'src/identity-and-access-context/business-logic/gateways/providers/encryption.provider';

type PlainValue = string;
type EncryptedValue = string;

export class FakeEncryptionProvider implements EncryptionProvider {
  encryptionMap: Record<PlainValue, EncryptedValue>;

  async encryptedValue(value: PlainValue): Promise<EncryptedValue> {
    return this.encryptionMap[value]!;
  }
}
