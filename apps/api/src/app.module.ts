import { Inject, Module, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ReportsModule } from './reports-context/adapters/primary/nestjs/reports.module';
import { DomainEventsPoller } from './shared-kernel/adapters/primary/nestjs/domain-event-poller';
import { SharedKernelModule } from './shared-kernel/adapters/primary/nestjs/shared-kernel.module';
import { DOMAIN_EVENTS_POLLER } from './shared-kernel/adapters/primary/nestjs/tokens';
import { DataAdministrationContextModule } from './data-administration-context/adapters/primary/nestjs/data-administration-context.module';
import { FilesContextModule } from './files-context/adapters/primary/nestjs/files-context.module';
import { APP_PIPE } from '@nestjs/core';
import { ZodValidationPipe } from 'nestjs-zod';

@Module({
  imports: [
    FilesContextModule,
    DataAdministrationContextModule,
    ReportsModule,
    SharedKernelModule,
  ],
  controllers: [],
  providers: [{ provide: APP_PIPE, useClass: ZodValidationPipe }],
})
export class AppModule implements OnModuleInit, OnModuleDestroy {
  private intervalId: NodeJS.Timeout | undefined;

  constructor(
    @Inject(DOMAIN_EVENTS_POLLER)
    private readonly domainEventsPoller: DomainEventsPoller,
  ) {}

  onModuleInit() {
    this.publishEvents();
  }

  onModuleDestroy() {
    this.stopPublishEvents();
  }

  private publishEvents() {
    this.intervalId = setInterval(async () => {
      try {
        await this.domainEventsPoller.execute();
      } catch (error) {
        console.error('Fail to publish domain events:', error);
      }
    }, 500);
  }

  private stopPublishEvents() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }
}
