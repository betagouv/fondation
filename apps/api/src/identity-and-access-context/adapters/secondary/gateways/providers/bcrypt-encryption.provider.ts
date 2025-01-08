import * as bcrypt from 'bcrypt';
import { EncryptionProvider } from 'src/identity-and-access-context/business-logic/gateways/providers/encryption.provider';

export class BcryptEncryptionProvider implements EncryptionProvider {
  async encryptedValue(value: string): Promise<string> {
    const salt = await bcrypt.genSalt();
    const hasedValue = await bcrypt.hash(value, salt);
    return hasedValue;
  }
}
