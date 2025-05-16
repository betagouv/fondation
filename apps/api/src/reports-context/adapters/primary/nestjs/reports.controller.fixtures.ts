import { Gender, Magistrat, Role, TypeDeSaisine } from 'shared-models';
import { DossierDeNominationDto } from 'src/reports-context/business-logic/gateways/services/dossier-de-nomination.service';
import { SessionDto } from 'src/reports-context/business-logic/gateways/services/session.service';
import { SessionValidationService } from 'src/shared-kernel/business-logic/gateways/services/session-validation.service';
import { BaseAppTestingModule } from 'test/base-app-testing-module';
import { StubDossierDeNominationService } from '../../secondary/gateways/services/stub-dossier-de-nomination.service';
import { StubSessionService } from '../../secondary/gateways/services/stub-session.service';
import { StubUserService } from '../../secondary/gateways/services/stub-user.service';
import {
  DOSSIER_DE_NOMINATION_SERVICE,
  SESSION_SERVICE,
  USER_SERVICE,
} from './tokens';

export class AppTestingModule extends BaseAppTestingModule {
  withStubSessionValidationService(validated: boolean) {
    this.moduleFixture.overrideProvider(SessionValidationService).useClass(
      class StubSessionValidationService {
        async validateSession(): ReturnType<
          SessionValidationService['validateSession']
        > {
          return validated ? stubUser : null;
        }
      },
    );
    return this;
  }

  withStubUserService() {
    this.moduleFixture.overrideProvider(USER_SERVICE).useFactory({
      factory: () => {
        const userService = new StubUserService();
        userService.user = stubUser;
        return userService;
      },
    });
    return this;
  }

  withStubSessionService() {
    this.moduleFixture.overrideProvider(SESSION_SERVICE).useFactory({
      factory: () => {
        const service = new StubSessionService();
        service.stubSession = stubSession;
        return service;
      },
    });
    return this;
  }

  withStubDossierDeNominationService() {
    this.moduleFixture
      .overrideProvider(DOSSIER_DE_NOMINATION_SERVICE)
      .useFactory({
        factory: () => {
          const service = new StubDossierDeNominationService();
          service.stubDossier = stubDossier;
          return service;
        },
      });
    return this;
  }
}

export const reporterId = '123e4567-e89b-12d3-a456-426614174000';

export const stubUser = {
  userId: reporterId,
  firstName: 'First-name',
  lastName: 'REPORTER',
  role: Role.MEMBRE_COMMUN,
  gender: Gender.M,
};

export const fileId1 = 'acd97958-5059-45b7-a3d9-4b46f000d2b4';
export const fileId2 = 'a25b1785-0ba0-47b0-b784-161c0e1afae0';
export const stubSessionId = 'a805f436-0f59-4b1d-b0cf-b382405eed68';
export const stubSession: SessionDto = {
  id: stubSessionId,
  name: 'Session 1',
  formation: Magistrat.Formation.PARQUET,
  sessionImportéeId: '4ebd0b50-d2e8-484c-a18d-7531879118ca',
  typeDeSaisine: TypeDeSaisine.TRANSPARENCE_GDS,
  version: 1,
};

export const stubDossier: DossierDeNominationDto<TypeDeSaisine.TRANSPARENCE_GDS> =
  {
    id: 'd619d2b0-6b1b-4793-bdf4-e27156c3df74',
    sessionId: stubSessionId,
    nominationFileImportedId: '0523baa3-c1dd-4d6b-bd2d-0d1df7c7a6d3',
    content: {
      biography: 'a biography',
      folderNumber: 123,
      formation: Magistrat.Formation.PARQUET,
      grade: Magistrat.Grade.HH,
      birthDate: {
        year: 1980,
        month: 1,
        day: 1,
      },
      currentPosition: 'a current position',
      dueDate: {
        year: 2030,
        month: 10,
        day: 5,
      },
      name: 'a name',
      targettedPosition: 'a targetted position',
      observers: ['observer 1', 'observer 2'],
      rank: '(1 sur 3)',
    },
  };
