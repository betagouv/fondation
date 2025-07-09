export class DeterministicUuidGenerator {
  nextUuids: string[] = ['96aea7f3-2297-425e-a067-a13dcc4272bf'];

  generate(): string {
    return this.nextUuids.shift()!;
  }

  genUuids(count: number): string[] {
    return Array.from({ length: count }, () => {
      const uuid = crypto.randomUUID();
      this.nextUuids.push(uuid);
      return uuid;
    });
  }

  genUuid = () => crypto.randomUUID();
}
