import { Module } from '@nestjs/common';

import { SimpleAuthModule } from 'src/modules/simple-auth';

import { AdministrationService } from './administration.service';
import { AdministrationController } from './infrastructure/administration.controller';
import { DetailsUserQuery } from './infrastructure/queries/details-user.query';
import { ListUsersQuery } from './infrastructure/queries/list-users.query';
import { UserRepository } from './infrastructure/repositories/user.repository';

@Module({
  imports: [SimpleAuthModule],
  providers: [AdministrationService, UserRepository, ListUsersQuery, DetailsUserQuery],
  controllers: [AdministrationController],
  exports: [AdministrationService],
})
export class AdministrationModule {}
