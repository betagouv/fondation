import { Module } from '@nestjs/common';
import { MembersModule } from 'src/modules/members';
import { SharedKernelModule } from 'src/shared-kernel/adapters/primary/nestjs/shared-kernel.module';
import { AffectationService } from './affectation.service';
import { AffectationRepository } from './infrastructure/affectation.repository';
import { ListAutoAffectationQuery } from './infrastructure/queries/list-auto-affectation.query';
import { NominationController } from './nomination.controller';

@Module({
  imports: [SharedKernelModule, MembersModule],
  controllers: [NominationController],
  providers: [
    AffectationService,
    AffectationRepository,
    ListAutoAffectationQuery,
  ],
  exports: [AffectationService],
})
export class NominationModule {}
