import { DossierDeNominationRepository } from 'src/nominations-context/dossier-de-nominations/business-logic/gateways/repositories/dossier-de-nomination.repository';
import { TransparenceRepository } from 'src/nominations-context/pp-gds/transparences/business-logic/gateways/repositories/transparence.repository';
import { AffectationRepository } from 'src/nominations-context/sessions/business-logic/gateways/repositories/affectation.repository';
import { PréAnalyseRepository } from 'src/nominations-context/sessions/business-logic/gateways/repositories/pré-analyse.repository';
import { SessionRepository } from 'src/nominations-context/sessions/business-logic/gateways/repositories/session.repository';
import {
  SharedKernelInjectionTokenMap,
  sharedKernelTokens,
} from 'src/shared-kernel/adapters/primary/nestjs/tokens';

export const DOSSIER_DE_NOMINATION_REPOSITORY =
  'DOSSIER_DE_NOMINATION_REPOSITORY';
export const SESSION_REPOSITORY = 'SESSION_REPOSITORY';
export const TRANSPARENCE_REPOSITORY = 'TRANSPARENCE_REPOSITORY';
export const PRE_ANALYSE_REPOSITORY = 'PRE_ANALYSE_REPOSITORY';
export const AFFECTATION_REPOSITORY = 'AFFECTATION_REPOSITORY';

export const nominationsTokens = [
  ...sharedKernelTokens,
  DOSSIER_DE_NOMINATION_REPOSITORY,
  SESSION_REPOSITORY,
  TRANSPARENCE_REPOSITORY,
  PRE_ANALYSE_REPOSITORY,
  AFFECTATION_REPOSITORY,
] as const;

export interface NominationsInjectionTokenMap
  extends SharedKernelInjectionTokenMap {
  [DOSSIER_DE_NOMINATION_REPOSITORY]: DossierDeNominationRepository;
  [SESSION_REPOSITORY]: SessionRepository;
  [TRANSPARENCE_REPOSITORY]: TransparenceRepository;
  [PRE_ANALYSE_REPOSITORY]: PréAnalyseRepository;
  [AFFECTATION_REPOSITORY]: AffectationRepository;
}
