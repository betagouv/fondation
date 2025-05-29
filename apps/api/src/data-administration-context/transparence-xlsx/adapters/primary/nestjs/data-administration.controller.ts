import { Controller, Post, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DataAdministrationContextRestContract } from 'shared-models';

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
  constructor() {}

  @Post(endpointsPaths.nouvelleTransparence)
  @UseInterceptors(FileInterceptor('fichier'))
  async nouvelleTransparence(): Promise<void> {}
}
