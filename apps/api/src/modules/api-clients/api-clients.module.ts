import { Module } from '@nestjs/common';

import { ApiClientsService } from './api-clients.service';
import { ApiClientAuthController } from './infrastructure/api-client-auth.controller';
import { ApiClientRepository } from './infrastructure/api-client.repository';

@Module({
  controllers: [ApiClientAuthController],
  exports: [ApiClientsService],
  providers: [ApiClientRepository, ApiClientsService],
})
export class ApiClientsModule {}
