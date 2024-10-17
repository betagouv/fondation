import { UuidGenerator } from 'src/shared-kernel/business-logic/gateways/providers/uuid-generator';

export class DeterministicUuidGenerator implements UuidGenerator {
  nextUuids: string[];

  generate(): string {
    return this.nextUuids.shift() || '96aea7f3-2297-425e-a067-a13dcc4272bf';
  }

  genUuids(count: number): string[] {
    return Array.from({ length: count }, () => {
      const uuid = crypto.randomUUID();
      this.nextUuids.push(uuid);
      return uuid;
    });
  }
}
