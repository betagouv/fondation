import * as bcrypt from 'bcrypt';
import { EncryptionProvider } from 'src/identity-and-access-context/business-logic/gateways/providers/encryption.provider';

export class BcryptEncryptionProvider implements EncryptionProvider {
  comparePasswords(password: string, encryptedPassword: string) {
    return bcrypt.compare(password, encryptedPassword);
  }

  async encryptedValue(value: string) {
    const salt = await bcrypt.genSalt();
    const hasedValue = await bcrypt.hash(value, salt);
    return hasedValue;
  }
}
