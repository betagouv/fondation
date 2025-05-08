import { AffectationRepository } from 'src/nominations-context/business-logic/gateways/repositories/affectation.repository';
import {
  SharedKernelInjectionTokenMap,
  sharedKernelTokens,
} from 'src/shared-kernel/adapters/primary/nestjs/tokens';
import { DossierDeNominationRepository } from '../../../business-logic/gateways/repositories/dossier-de-nomination.repository';
import { PréAnalyseRepository } from '../../../business-logic/gateways/repositories/pré-analyse.repository';
import { SessionRepository } from '../../../business-logic/gateways/repositories/session.repository';

export const DOSSIER_DE_NOMINATION_REPOSITORY =
  'DOSSIER_DE_NOMINATION_REPOSITORY';
export const PRE_ANALYSE_REPOSITORY = 'PRE_ANALYSE_REPOSITORY';
export const SESSION_REPOSITORY = 'SESSION_REPOSITORY';
export const AFFECTATION_REPOSITORY = 'AFFECTATION_REPOSITORY';

export const nominationsTokens = [
  ...sharedKernelTokens,
  DOSSIER_DE_NOMINATION_REPOSITORY,
  PRE_ANALYSE_REPOSITORY,
  SESSION_REPOSITORY,
  AFFECTATION_REPOSITORY,
] as const;

export interface NominationsInjectionTokenMap
  extends SharedKernelInjectionTokenMap {
  [DOSSIER_DE_NOMINATION_REPOSITORY]: DossierDeNominationRepository;
  [PRE_ANALYSE_REPOSITORY]: PréAnalyseRepository;
  [SESSION_REPOSITORY]: SessionRepository;
  [AFFECTATION_REPOSITORY]: AffectationRepository;
}
