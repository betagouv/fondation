import { Module } from '@nestjs/common';

import { DocsModule } from '../docs/docs.module';
import { SimpleAuthModule } from '../simple-auth';

import { AdministrationService } from './administration.service';
import { AdministrationController } from './infrastructure/administration.controller';
import { MemberRecusalTitleController } from './infrastructure/member-recusal-title.controller';
import { DetailsUserQuery } from './infrastructure/queries/details-user.query';
import { ListTitleHoldersQuery } from './infrastructure/queries/list-title-holders.query';
import { ListUsersQuery } from './infrastructure/queries/list-users.query';
import { RegistrationController } from './infrastructure/registration.controller';
import { UserRepository } from './infrastructure/repositories/user.repository';

@Module({
  controllers: [AdministrationController, MemberRecusalTitleController, RegistrationController],
  exports: [AdministrationService],
  imports: [DocsModule, SimpleAuthModule],
  providers: [AdministrationService, UserRepository, ListUsersQuery, DetailsUserQuery, ListTitleHoldersQuery],
})
export class AdministrationModule {}
