import { DossierDeNominationRepository } from 'src/nominations-context/dossier-de-nominations/business-logic/gateways/repositories/dossier-de-nomination.repository';
import { TransparenceRepository } from 'src/nominations-context/pp-gds/transparences/business-logic/gateways/repositories/transparence.repository';
import { AffectationRepository } from 'src/nominations-context/sessions/business-logic/gateways/repositories/affectation.repository';
import { PréAnalyseRepository } from 'src/nominations-context/sessions/business-logic/gateways/repositories/pré-analyse.repository';
import { SessionRepository } from 'src/nominations-context/sessions/business-logic/gateways/repositories/session.repository';
import { SessionEnrichmentService } from 'src/nominations-context/sessions/business-logic/services/session-enrichment.service';
import { SessionEnrichmentStrategyFactory } from 'src/nominations-context/sessions/business-logic/strategy/session-enrichment-strategy-factory';
import { ReportRepository } from 'src/reports-context/business-logic/gateways/repositories/report.repository';
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
export const REPORT_REPOSITORY = 'REPORT_REPOSITORY';
export const SESSION_ENRICHMENT_SERVICE = 'SESSION_ENRICHMENT_SERVICE';
export const SESSION_ENRICHMENT_STRATEGY_FACTORY =
  'SESSION_ENRICHMENT_STRATEGY_FACTORY';

export const nominationsTokens = [
  ...sharedKernelTokens,
  DOSSIER_DE_NOMINATION_REPOSITORY,
  SESSION_REPOSITORY,
  TRANSPARENCE_REPOSITORY,
  PRE_ANALYSE_REPOSITORY,
  AFFECTATION_REPOSITORY,
  REPORT_REPOSITORY,
  SESSION_ENRICHMENT_SERVICE,
  SESSION_ENRICHMENT_STRATEGY_FACTORY,
] as const;

export interface NominationsInjectionTokenMap
  extends SharedKernelInjectionTokenMap {
  [DOSSIER_DE_NOMINATION_REPOSITORY]: DossierDeNominationRepository;
  [SESSION_REPOSITORY]: SessionRepository;
  [TRANSPARENCE_REPOSITORY]: TransparenceRepository;
  [PRE_ANALYSE_REPOSITORY]: PréAnalyseRepository;
  [AFFECTATION_REPOSITORY]: AffectationRepository;
  [REPORT_REPOSITORY]: ReportRepository;
  [SESSION_ENRICHMENT_SERVICE]: SessionEnrichmentService;
  [SESSION_ENRICHMENT_STRATEGY_FACTORY]: SessionEnrichmentStrategyFactory;
}
