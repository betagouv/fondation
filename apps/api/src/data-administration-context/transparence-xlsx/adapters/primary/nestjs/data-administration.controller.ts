import {
  Controller,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { DataAdministrationContextRestContract } from 'shared-models';

import { ImportTransparenceXlsxUseCase } from 'src/data-administration-context/transparence-xlsx/business-logic/use-cases/import-transparence-xlsx/import-transparence-xlsx.use-case';
import {
  IController,
  IControllerPaths,
} from 'src/shared-kernel/adapters/primary/nestjs/controller';
import { DateOnly } from 'src/shared-kernel/business-logic/models/date-only';
import { ImportNouvelleTransparenceXlsxNestDto } from './dto/import-nouvelle-transparence.nest-dto';
import { FileInterceptor } from 'src/shared-kernel/adapters/primary/nestjs/interceptors/file.interceptor';

type IDataAdministrationController =
  IController<DataAdministrationContextRestContract>;

const baseRoute: DataAdministrationContextRestContract['basePath'] =
  'api/data-administration';

const endpointsPaths: IControllerPaths<DataAdministrationContextRestContract> =
  {
    importNouvelleTransparenceXlsx: 'import-nouvelle-transparence-xlsx',
  };

@Controller(baseRoute)
export class DataAdministrationController
  implements IDataAdministrationController
{
  constructor(
    private readonly importTransparenceXlsx: ImportTransparenceXlsxUseCase,
  ) {}

  @Post(endpointsPaths.importNouvelleTransparenceXlsx)
  @UseInterceptors(FileInterceptor('fichier'))
  async importNouvelleTransparenceXlsx(
    _: unknown,
    @UploadedFile() fichier: Express.Multer.File,
    @Query() dto: ImportNouvelleTransparenceXlsxNestDto,
  ): Promise<void> {
    await this.importTransparenceXlsx.execute(
      new File([fichier.buffer], fichier.originalname),
      dto.formation,
      dto.nomTransparence,
      DateOnly.fromString(dto.dateTransparence, 'yyyy-MM-dd').toJson(),
      dto.dateEcheance
        ? DateOnly.fromString(dto.dateEcheance, 'yyyy-MM-dd').toJson()
        : null,
      dto.datePriseDePosteCible
        ? DateOnly.fromString(dto.datePriseDePosteCible, 'yyyy-MM-dd').toJson()
        : null,
      DateOnly.fromString(
        dto.dateClotureDelaiObservation,
        'yyyy-MM-dd',
      ).toJson(),
    );
  }
}
