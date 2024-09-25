import { PositionGeography } from './PositionGeography';

export enum PositionTitle {
  PRESIDENT = 'Président',
  PREMIER_PRESIDENT = 'Premier président',
  PROCUREUR_GENERAL = 'Procureur général',
  AVOCAT_GENERAL = 'Avocat Général',
}

export type JudiciaryRole = 'SIEGE' | 'PARQUET';
export type JuridictionDegree =
  | 'COUR_CASSATION'
  | 'COUR_APPEL'
  | 'TRIBUNAL_JUDICIAIRE'
  | 'MINISTERE';

export class Position {
  private readonly titleToJudiciaryRole: Record<PositionTitle, JudiciaryRole> =
    {
      [PositionTitle.PRESIDENT]: 'SIEGE',
      [PositionTitle.PREMIER_PRESIDENT]: 'SIEGE',
      [PositionTitle.PROCUREUR_GENERAL]: 'PARQUET',
      [PositionTitle.AVOCAT_GENERAL]: 'PARQUET',
    };
  private readonly titleToJuridictionDegree: Record<
    PositionTitle,
    JuridictionDegree
  > = {
    [PositionTitle.PRESIDENT]: 'TRIBUNAL_JUDICIAIRE',
    [PositionTitle.PREMIER_PRESIDENT]: 'COUR_APPEL',
    [PositionTitle.PROCUREUR_GENERAL]: 'COUR_APPEL',
    [PositionTitle.AVOCAT_GENERAL]: 'COUR_APPEL',
  };

  constructor(
    readonly title: PositionTitle,
    readonly geography: PositionGeography,
  ) {}

  isSameJudiciaryRoleAs(position: Position): boolean {
    return this.getJudiciaryRole() === position.getJudiciaryRole();
  }
  isSameJuridictionDegreeAs(position: Position): boolean {
    return this.getJuridictionDegree() === position.getJuridictionDegree();
  }
  isSameRessortAs(newPosition: Position): boolean {
    return this.geography.getRessort() === newPosition.geography.getRessort();
  }

  private getJuridictionDegree(): JuridictionDegree {
    return this.titleToJuridictionDegree[this.title];
  }
  private getJudiciaryRole(): JudiciaryRole {
    return this.titleToJudiciaryRole[this.title];
  }
}
