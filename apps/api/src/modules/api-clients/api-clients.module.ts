import { Module } from '@nestjs/common';

import { ApiClientsService } from './api-clients.service';
import { ApiClientAuthController } from './infrastructure/api-client-auth.controller';
import { ApiClientPurge } from './infrastructure/api-client-purge';
import { ApiClientRepository } from './infrastructure/api-client.repository';

@Module({
  controllers: [ApiClientAuthController],
  exports: [ApiClientsService],
  providers: [ApiClientPurge, ApiClientRepository, ApiClientsService],
})
export class ApiClientsModule {}
