import { Module } from '@nestjs/common';
import { MembersModule } from 'src/modules/members';

@Module({
  imports: [MembersModule],
})
export class NominationModule {}
