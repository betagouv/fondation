import { Module } from '@nestjs/common';
import { IngestController } from './infrastructure/ingest.controller';
import { LolfiTypeJuridictionIngestor } from './services/ingestors/lolfi-type-juridiction.ingestor';
import { LolfiArchiveIngestor } from './services/lolfi-archive-ingest';

@Module({
  controllers: [IngestController],
  providers: [LolfiArchiveIngestor, LolfiTypeJuridictionIngestor],
})
export class IngestModule {}
