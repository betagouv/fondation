import { DossierDeNominationSnapshot } from 'shared-models/models/session/dossier-de-nomination';

export type DossierDeNominationDto = DossierDeNominationSnapshot;

export type PropositionDeNominationTransparenceDto = DossierDeNominationDto;

export type PropositionDeNominationTransparenceV1Dto = DossierDeNominationDto;

export type PropositionDeNominationTransparenceV2Dto = DossierDeNominationDto;

export interface DossierDeNominationService {
  dossierDeNomination(
    dossierDeNominationId: string,
  ): Promise<DossierDeNominationDto>;
}
