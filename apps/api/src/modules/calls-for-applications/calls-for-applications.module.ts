import { Module } from '@nestjs/common';

import { CallsForApplicationsController } from './calls-for-applications.controller';
import { CallsForApplicationsService } from './calls-for-applications.service';
import { CallForApplicationsRepository } from './infrastructure/call-for-applications.repository';
import { TargetableCourtFinder } from './infrastructure/finders/targetable-court.finder';
import { FindCallForApplicationsFormQuery } from './infrastructure/queries/find-call-for-applications-form.query';
import { ListCallsForApplicationsQuery } from './infrastructure/queries/list-calls-for-applications.query';

@Module({
  controllers: [CallsForApplicationsController],
  providers: [
    CallForApplicationsRepository,
    CallsForApplicationsService,
    FindCallForApplicationsFormQuery,
    ListCallsForApplicationsQuery,
    TargetableCourtFinder,
  ],
})
export class CallsForApplicationsModule {}
