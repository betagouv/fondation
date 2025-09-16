import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { NominationsContextSessionsRestContract } from 'shared-models';
import { GetSessionsUseCase } from 'src/nominations-context/sessions/business-logic/use-cases/get-sessions/get-sessions.use-case';
import {
  IController,
  IControllerPaths,
} from 'src/shared-kernel/adapters/primary/nestjs/controller';
import { GetDossierDeNominationSnapshotUseCase } from '../../../../dossier-de-nominations/business-logic/use-cases/get-dossier-de-nomination-snapshot/get-dossier-de-nomination-snapshot.use-case';
import { GetSessionSnapshotUseCase } from '../../../business-logic/use-cases/get-session-snapshot/get-session-snapshot.use-case';
import { SessionSnapshotParamsNestDto } from './dto/session-snapshot-params.nest-dto';

type ISessionsController = IController<NominationsContextSessionsRestContract>;

export const baseRoute: NominationsContextSessionsRestContract['basePath'] =
  'api/nominations/sessions';
export const endpointsPaths: IControllerPaths<NominationsContextSessionsRestContract> =
  {
    sessions: '',
    sessionSnapshot: 'session/snapshot/by-id/:sessionId',
  };

@Controller(baseRoute)
export class SessionsController implements ISessionsController {
  constructor(
    private readonly getDossierDeNominationSnapshotUseCase: GetDossierDeNominationSnapshotUseCase,
    private readonly getSessionSnapshotUseCase: GetSessionSnapshotUseCase,
    private readonly getSessionsUseCase: GetSessionsUseCase,
  ) {}

  @Get(endpointsPaths.sessions)
  async sessions() {
    return this.getSessionsUseCase.execute();
  }

  @Get(endpointsPaths.sessionSnapshot)
  async sessionSnapshot(@Param() params: SessionSnapshotParamsNestDto) {
    const session = await this.getSessionSnapshotUseCase.execute(
      params.sessionId,
    );
    if (!session) {
      throw new NotFoundException(
        `Session with ID ${params.sessionId} not found`,
      );
    }

    return session;
  }
}
