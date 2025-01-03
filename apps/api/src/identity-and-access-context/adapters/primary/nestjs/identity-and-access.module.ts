import { Module } from '@nestjs/common';
import { RegisterUserUseCase } from 'src/identity-and-access-context/business-logic/use-cases/user-registration/register-user.use-case';
import { SharedKernelModule } from 'src/shared-kernel/adapters/primary/nestjs/shared-kernel.module';
import { SqlUserRepository } from '../../secondary/gateways/repositories/drizzle/sql-user.repository';
import { generateIdentityAndAccessProvider as generateProvider } from './provider-generator';
import { USER_REPOSITORY } from './tokens';

@Module({
  imports: [SharedKernelModule],
  providers: [
    generateProvider(SqlUserRepository, [], USER_REPOSITORY),
    generateProvider(RegisterUserUseCase, [
      'TRANSACTION_PERFORMER',
      'UUID_GENERATOR',
      'DATE_TIME_PROVIDER',
      'DOMAIN_EVENT_REPOSITORY',
      USER_REPOSITORY,
    ]),
  ],
})
export class IdentityAndAccessModule {}
