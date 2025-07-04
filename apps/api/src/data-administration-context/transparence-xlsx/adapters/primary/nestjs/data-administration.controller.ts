import {
  Controller,
  HttpCode,
  HttpStatus,
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
import { ImportObservantsXlsxUseCase } from 'src/data-administration-context/transparence-xlsx/business-logic/use-cases/import-observants-xlsx/import-observants-xlsx.use-case';
import { ImportObservantsXlsxNestDto } from './dto/import-observants-xlsx.nest-dto';

type IDataAdministrationController =
  IController<DataAdministrationContextRestContract>;

const baseRoute: DataAdministrationContextRestContract['basePath'] =
  'api/data-administration';

const endpointsPaths: IControllerPaths<DataAdministrationContextRestContract> =
  {
    importNouvelleTransparenceXlsx: 'import-nouvelle-transparence-xlsx',
    importObservantsXlsx: 'import-observants-xlsx',
  };

@Controller(baseRoute)
export class DataAdministrationController
  implements IDataAdministrationController
{
  constructor(
    private readonly importTransparenceXlsx: ImportTransparenceXlsxUseCase,
    private readonly importObservantsXlsxUseCase: ImportObservantsXlsxUseCase,
  ) {}

  @Post(endpointsPaths.importNouvelleTransparenceXlsx)
  @UseInterceptors(FileInterceptor('fichier'))
  async importNouvelleTransparenceXlsx(
    _: unknown,
    @UploadedFile() fichier: Express.Multer.File,
    @Query() dto: ImportNouvelleTransparenceXlsxNestDto,
  ) {
    const resp = await this.importTransparenceXlsx.execute(
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

    return resp;
  }

  @HttpCode(HttpStatus.OK)
  @Post(endpointsPaths.importObservantsXlsx)
  @UseInterceptors(FileInterceptor('fichier'))
  async importObservantsXlsx(
    _: unknown,
    @UploadedFile() fichier: Express.Multer.File,
    @Query() dto: ImportObservantsXlsxNestDto,
  ) {
    const resp = await this.importObservantsXlsxUseCase.execute(
      new File([fichier.buffer], fichier.originalname),
      dto.formation,
      dto.nomTransparence,
      DateOnly.fromString(dto.dateTransparence, 'yyyy-MM-dd').toJson(),
    );

    return resp;
  }
}
