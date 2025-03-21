export class OptimisticLockError extends Error {
  constructor({
    entityName,
    entityId,
    version,
  }: {
    entityName: string;
    entityId: string;
    version: number;
  }) {
    super(
      `${entityName} with id ${entityId} has an outdated version ${version}`,
    );
    this.name = 'OptimisticLockError';
  }
}
