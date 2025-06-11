import { Controller, Get, NotFoundException, Query } from '@nestjs/common';
import { NominationsContextTransparenceRestContract } from 'shared-models';
import {
  IController,
  IControllerPaths,
} from 'src/shared-kernel/adapters/primary/nestjs/controller';
import { GetTransparenceSnapshotUseCase } from '../../../business-logic/use-cases/get-transparence-snapshot/get-transparence-snapshot.use-case';
import { TransparenceSnapshotQueryParamsNestDto } from './dto/transparence-snapshot-query-params.nest-dto';

type ITransparencesController =
  IController<NominationsContextTransparenceRestContract>;

export const baseRoute: NominationsContextTransparenceRestContract['basePath'] =
  'api/nominations/transparence';
export const endpointsPaths: IControllerPaths<NominationsContextTransparenceRestContract> =
  {
    transparenceSnapshot: 'snapshot/by-nom-formation-et-date',
  };

@Controller(baseRoute)
export class TransparencesController implements ITransparencesController {
  constructor(
    private readonly getTransparenceSnapshotUseCase: GetTransparenceSnapshotUseCase,
  ) {}

  @Get(endpointsPaths.transparenceSnapshot)
  async transparenceSnapshot(
    @Query() params: TransparenceSnapshotQueryParamsNestDto,
  ) {
    const transparence = await this.getTransparenceSnapshotUseCase.execute(
      params.nom,
      params.formation,
      {
        year: params.year,
        month: params.month,
        day: params.day,
      },
    );
    if (!transparence) {
      throw new NotFoundException(
        `Transparence ${params.nom}, formation ${params.formation}, avec la date ${params.day}/${params.month}/${params.year} non trouvée`,
      );
    }

    return transparence;
  }
}
