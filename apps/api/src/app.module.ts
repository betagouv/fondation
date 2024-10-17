import { Inject, Module } from '@nestjs/common';
import { ReporterModule } from './reporter-context/adapters/primary/nestjs/reporter.module';
import { DomainEventsPoller } from './shared-kernel/adapters/primary/nestjs/domainEventPoller';
import { DOMAIN_EVENTS_POLLER } from './shared-kernel/adapters/primary/nestjs/shared-kernel.module';

@Module({
  imports: [ReporterModule],
  controllers: [],
  providers: [],
})
export class AppModule {
  private intervalId: NodeJS.Timeout | undefined;

  constructor(
    @Inject(DOMAIN_EVENTS_POLLER)
    private readonly domainEventsPoller: DomainEventsPoller,
  ) {}

  onModuleInit() {
    this.publishEvents();
  }

  public onModuleDestroy() {
    this.stopPublishEvents();
  }

  public publishEvents() {
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
