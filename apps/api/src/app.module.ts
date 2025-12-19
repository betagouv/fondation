import { Module } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { ZodValidationPipe } from 'nestjs-zod';
import { FilesContextModule } from './files-context/adapters/primary/nestjs/files-context.module';
import { IdentityAndAccessModule } from './identity-and-access-context/adapters/primary/nestjs/identity-and-access.module';
import { RootModule } from './modules/root.module';
import { SharedKernelModule } from './shared-kernel/adapters/primary/nestjs/shared-kernel.module';

@Module({
  imports: [
    RootModule,
    SharedKernelModule,
    FilesContextModule,
    IdentityAndAccessModule,
  ],
  providers: [{ provide: APP_PIPE, useClass: ZodValidationPipe }],
})
export class AppModule {}
