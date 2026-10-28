import { Module } from '@nestjs/common';

import { SimpleAuthModule } from '../simple-auth';

import { AdministrationService } from './administration.service';
import { AdministrationController } from './infrastructure/administration.controller';
import { DetailsUserQuery } from './infrastructure/queries/details-user.query';
import { ListUsersQuery } from './infrastructure/queries/list-users.query';
import { RegistrationController } from './infrastructure/registration.controller';
import { UserRepository } from './infrastructure/repositories/user.repository';

@Module({
  controllers: [AdministrationController, RegistrationController],
  exports: [AdministrationService],
  imports: [SimpleAuthModule],
  providers: [AdministrationService, UserRepository, ListUsersQuery, DetailsUserQuery],
})
export class AdministrationModule {}
