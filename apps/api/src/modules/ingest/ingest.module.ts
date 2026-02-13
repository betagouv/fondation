import { Module } from '@nestjs/common';
import { IngestController } from './infrastructure/ingest.controller';

@Module({ controllers: [IngestController] })
export class IngestModule {}
