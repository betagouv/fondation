import {
  Body,
  Controller,
  Get,
  InternalServerErrorException,
  NotFoundException,
  Param,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { DossierDeNominationRestContrat } from 'shared-models/models/endpoints/nominations/dossier-de-nominations.endpoints';
import { DossierDeNominationEtAffectationParamsNestDto } from 'src/nominations-context/dossier-de-nominations/adapters/primary/nestjs/dto/dossier-de-nomination-et-affectation.nest-dto';
import { DossierDeNominationSnapshotParamsNestDto } from 'src/nominations-context/dossier-de-nominations/adapters/primary/nestjs/dto/dossier-de-nomination-snapshot-params.dto';
import { SaveAffectationsRapporteursNestDto } from 'src/nominations-context/dossier-de-nominations/adapters/primary/nestjs/dto/save-affectations-rapporteurs.nest-dto';
import { GetBySessionIdUseCase } from 'src/nominations-context/dossier-de-nominations/business-logic/use-cases/get-by-session-id/get-dossier-de-nomination-snapshot.use-case';
import { GetDossierDeNominationSnapshotUseCase } from 'src/nominations-context/dossier-de-nominations/business-logic/use-cases/get-dossier-de-nomination-snapshot/get-dossier-de-nomination-snapshot.use-case';
import { PublierAffectationsUseCase } from 'src/nominations-context/dossier-de-nominations/business-logic/use-cases/publier-affectations/publier-affectations.use-case';
import { SaveAffectationsRapporteursUseCase } from 'src/nominations-context/dossier-de-nominations/business-logic/use-cases/save-affectations-rapporteurs/save-affectations-rapporteurs.use-case';
import {
  IController,
  IControllerPaths,
} from 'src/shared-kernel/adapters/primary/nestjs/controller';

type IDossierDeNominationController =
  IController<DossierDeNominationRestContrat>;

export const baseRouteDossierDeNomination: DossierDeNominationRestContrat['basePath'] =
  'api/nominations/dossier-de-nominations';
export const dossierDeNominationsEndpointsPath: IControllerPaths<DossierDeNominationRestContrat> =
  {
    dossierDeNominationSnapshot: 'snapshot/by-id/:dossierId',
    dossierDeNominationEtAffectationParSession: 'snapshot/by-session',
    saveAffectationsRapporteurs: 'affectations-rapporteurs',
  };

@Controller(baseRouteDossierDeNomination)
export class DossierDeNominationController
  implements IDossierDeNominationController
{
  constructor(
    private readonly getDossierDeNominationSnapshotUseCase: GetDossierDeNominationSnapshotUseCase,
    private readonly getBySessionIdUseCase: GetBySessionIdUseCase,
    private readonly saveAffectationsRapporteursUseCase: SaveAffectationsRapporteursUseCase,
    private readonly publierAffectationsUseCase: PublierAffectationsUseCase,
  ) {}

  @Get(
    dossierDeNominationsEndpointsPath.dossierDeNominationEtAffectationParSession,
  )
  async dossierDeNominationEtAffectationParSession(
    @Query() params: DossierDeNominationEtAffectationParamsNestDto,
  ) {
    return this.getBySessionIdUseCase.execute(params);
  }

  @Get(dossierDeNominationsEndpointsPath.dossierDeNominationSnapshot)
  async dossierDeNominationSnapshot(
    @Param() params: DossierDeNominationSnapshotParamsNestDto,
  ) {
    const dossier = await this.getDossierDeNominationSnapshotUseCase.execute(
      params.dossierId,
    );

    if (!dossier) {
      throw new NotFoundException(
        `Dossier de nomination with ID ${params.dossierId} not found`,
      );
    }

    return dossier;
  }

  @Post(dossierDeNominationsEndpointsPath.saveAffectationsRapporteurs)
  async saveAffectationsRapporteurs(
    @Body() body: SaveAffectationsRapporteursNestDto,
  ) {
    return this.saveAffectationsRapporteursUseCase.execute(body);
  }

  @Post('affectations-rapporteurs/:sessionId/publier')
  async publierAffectations(
    @Param('sessionId') sessionId: string,
    @Req() req: Request,
  ) {
    const auteurId = req.userId!;
    if (!auteurId) {
      throw new InternalServerErrorException('Aucune utilisateur connecté');
    }
    return this.publierAffectationsUseCase.execute(sessionId, auteurId);
  }
}
