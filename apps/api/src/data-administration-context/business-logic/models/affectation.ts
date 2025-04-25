import { Magistrat } from 'shared-models';

export type NominationFileAffectation = {
  nominationFileId: string;
  reporterIds: string[];
};

export class Affectation {
  constructor(
    private _transparenceId: string,
    private _formationsAffectées: Set<Magistrat.Formation>,
    private _nominationFileAffectations: NominationFileAffectation[],
  ) {}
}
