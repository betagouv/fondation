import { Module } from '@nestjs/common';

import { ApiClientsService } from './api-clients.service';
import { ApiClientAuthController } from './infrastructure/api-client-auth.controller';
import { ApiClientPurge } from './infrastructure/api-client-purge';
import { ApiClientRepository } from './infrastructure/api-client.repository';
import { ApiClientsAdministrationController } from './infrastructure/api-clients-administration.controller';
import { ListApiClientChangesQuery } from './infrastructure/queries/list-api-client-changes.query';
import { ListApiClientsQuery } from './infrastructure/queries/list-api-clients.query';

@Module({
  controllers: [ApiClientAuthController, ApiClientsAdministrationController],
  exports: [ApiClientsService],
  providers: [
    ApiClientPurge,
    ApiClientRepository,
    ApiClientsService,
    ListApiClientChangesQuery,
    ListApiClientsQuery,
  ],
})
export class ApiClientsModule {}
