import { Module } from '@nestjs/common';
import { ReporterModule } from './reporter-context/adapters/primary/nestjs/reporter.module';

@Module({
  imports: [ReporterModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
