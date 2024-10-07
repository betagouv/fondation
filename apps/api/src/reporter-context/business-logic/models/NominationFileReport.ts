export enum NominationFileRule {
  PROFILED_POSITION = 'PROFILED_POSITION',
  OVERSEAS_TO_OVERSEAS = 'OVERSEAS_TO_OVERSEAS',
}

export class NominationFileReport {
  constructor(
    readonly id: string,
    readonly managementRules: Record<
      NominationFileRule,
      { validated: boolean }
    >,
  ) {}
}
