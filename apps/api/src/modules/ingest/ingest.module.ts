import { Module } from '@nestjs/common';
import { IngestController } from './infrastructure/ingest.controller';
import { LolfiArchiveIngestor } from './services/lolfi-archive-ingest';

@Module({ controllers: [IngestController], providers: [LolfiArchiveIngestor] })
export class IngestModule {}
