import { UuidGenerator } from 'src/shared-kernel/business-logic/gateways/providers/uuid-generator';

export class DeterministicUuidGenerator implements UuidGenerator {
  nextUuid: string;

  generate(): string {
    return this.nextUuid;
  }
}
