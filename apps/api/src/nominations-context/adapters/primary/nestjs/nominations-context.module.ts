import { Module } from '@nestjs/common';
import { SharedKernelModule } from 'src/shared-kernel/adapters/primary/nestjs/shared-kernel.module';
import {
  DOMAIN_EVENT_REPOSITORY,
  TRANSACTION_PERFORMER,
} from 'src/shared-kernel/adapters/primary/nestjs/tokens';
import { ImportNouvelleTransparenceUseCase } from '../../../business-logic/use-cases/import-nouvelle-transparence/import-nouvelle-transparence.use-case';
import { ImportNouveauxDossiersTransparenceUseCase } from '../../../business-logic/use-cases/import-nouveaux-dossiers-transparence/import-nouveaux-dossiers-transparence.use-case';
import { UpdateDossierDeNominationUseCase } from '../../../business-logic/use-cases/update-dossier-de-nomination/update-dossier-de-nomination.use-case';
import { TransparenceService } from '../../../business-logic/services/transparence.service';
import { GdsTransparenceNouveauxDossiersSubscriber } from '../../../business-logic/listeners/gds-transparence-nouveaux-dossiers.subscriber';
import { GdsTransparenceDossiersModifiésSubscriber } from '../../../business-logic/listeners/gds-transparence-dossiers-modifiés.subscriber';
import { GdsNouvellesTransparencesImportéesSubscriber } from '../../../business-logic/listeners/gds-nouvelles-transparences-importées.subscriber';
import { GdsTransparenceNouveauxDossiersNestSubscriber } from './event-subscribers/gds-transparence-nouveaux-dossiers.nest-subscriber';
import { GdsTransparenceDossiersModifiésNestSubscriber } from './event-subscribers/gds-transparence-dossiers-modifiés.nest-subscriber';
import { generateNominationsProvider as generateProvider } from './provider-generator';
import {
  AFFECTATION_REPOSITORY,
  DOSSIER_DE_NOMINATION_REPOSITORY,
  PRE_ANALYSE_REPOSITORY,
  SESSION_REPOSITORY,
} from './tokens';
import { FakeSessionRepository } from '../../secondary/gateways/repositories/fake-session.repository';
import { FakeDossierDeNominationRepository } from '../../secondary/gateways/repositories/fake-dossier-de-nomination.repository';
import { FakePréAnalyseRepository } from '../../secondary/gateways/repositories/fake-pré-analyse.repository';
import { FakeAffectationRepository } from '../../secondary/gateways/repositories/fake-affectation.repository';
import { GdsNouvellesTransparencesImportéesNestSubscriber } from './event-subscribers/gds-nouvelles-transparences-importées.nest-subscriber';

@Module({
  imports: [SharedKernelModule],
  providers: [
    GdsNouvellesTransparencesImportéesNestSubscriber,
    GdsTransparenceNouveauxDossiersNestSubscriber,
    GdsTransparenceDossiersModifiésNestSubscriber,

    generateProvider(GdsTransparenceNouveauxDossiersSubscriber, [
      ImportNouveauxDossiersTransparenceUseCase,
    ]),
    generateProvider(GdsTransparenceDossiersModifiésSubscriber, [
      UpdateDossierDeNominationUseCase,
    ]),
    generateProvider(GdsNouvellesTransparencesImportéesSubscriber, [
      ImportNouvelleTransparenceUseCase,
    ]),

    generateProvider(ImportNouvelleTransparenceUseCase, [
      TRANSACTION_PERFORMER,
      TransparenceService,
    ]),
    generateProvider(UpdateDossierDeNominationUseCase, [
      TRANSACTION_PERFORMER,
      DOSSIER_DE_NOMINATION_REPOSITORY,
      PRE_ANALYSE_REPOSITORY,
    ]),
    generateProvider(ImportNouveauxDossiersTransparenceUseCase, [
      TRANSACTION_PERFORMER,
      SESSION_REPOSITORY,
      TransparenceService,
    ]),

    generateProvider(TransparenceService, [
      DOSSIER_DE_NOMINATION_REPOSITORY,
      PRE_ANALYSE_REPOSITORY,
      SESSION_REPOSITORY,
      AFFECTATION_REPOSITORY,
      DOMAIN_EVENT_REPOSITORY,
    ]),

    generateProvider(FakeSessionRepository, [], SESSION_REPOSITORY),
    generateProvider(
      FakeDossierDeNominationRepository,
      [],
      DOSSIER_DE_NOMINATION_REPOSITORY,
    ),
    generateProvider(FakePréAnalyseRepository, [], PRE_ANALYSE_REPOSITORY),
    generateProvider(FakeAffectationRepository, [], AFFECTATION_REPOSITORY),
  ],
  exports: [],
})
export class NominationsContextModule {}
