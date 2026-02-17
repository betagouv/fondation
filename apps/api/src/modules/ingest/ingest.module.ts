import { Module } from '@nestjs/common';
import { IngestController } from './infrastructure/ingest.controller';
import { IngestService } from './infrastructure/ingest.service';
import { JobsModule } from './jobs/jobs.module';
import { JobFileIngestor } from './services/ingestors/job-file-ingestor';
import { LolfiFileIngestor } from './services/ingestors/lolfi-files.ingestor';
import { LolfiTypeJuridictionIngestor } from './services/ingestors/lolfi-type-juridiction.ingestor';
import { LolfiArchiveIngestor } from './services/lolfi-archive-ingest';

@Module({
  imports: [JobsModule],
  controllers: [IngestController],
  providers: [
    IngestService,
    LolfiArchiveIngestor,
    LolfiFileIngestor,
    JobFileIngestor,
    LolfiTypeJuridictionIngestor,
  ],
})
export class IngestModule {}
