import {
  Body,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  NouvelleTransparenceDto,
  DataAdministrationContextRestContract,
} from 'shared-models';

import {
  IController,
  IControllerPaths,
} from 'src/shared-kernel/adapters/primary/nestjs/controller';

type IDataAdministrationController =
  IController<DataAdministrationContextRestContract>;

const baseRoute: DataAdministrationContextRestContract['basePath'] =
  'api/data-administration';

const endpointsPaths: IControllerPaths<DataAdministrationContextRestContract> =
  {
    nouvelleTransparence: 'nouvelle-transparence',
  };

@Controller(baseRoute)
export class DataAdministrationController
  implements IDataAdministrationController
{
  constructor(
    private readonly nouvelleTransparenceUseCase: NouvelleTransparenceUseCase,
  ) {}

  @Post(endpointsPaths.nouvelleTransparence)
  @UseInterceptors(FileInterceptor('fichier'))
  async nouvelleTransparence(
    @UploadedFile() fichier: Express.Multer.File,
    @Body() body: NouvelleTransparenceDto,
  ): Promise<void> {
    // return this.nouvelleTransparenceUseCase.execute(nouvelleTransparenceDto);
  }
}
