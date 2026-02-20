import { Module } from '@nestjs/common';
import { IngestController } from './infrastructure/ingest.controller';
import { IngestService } from './infrastructure/ingest.service';
import { JobsModule } from './jobs/jobs.module';
import { JobFileIngestor } from './services/ingestors/job-file-ingestor';
import { LolfiFilesIngestor } from './services/ingestors/lolfi-files.ingestor';
import { LolfiFonctionsIngestor } from './services/ingestors/lolfi-fonctions.ingestor';
import { LolfiGradesIngestor } from './services/ingestors/lolfi-grades.ingestor';
import { LolfiJuridictionIngestor } from './services/ingestors/lolfi-juridiction.ingestor';
import { LolfiPosadsIngestor } from './services/ingestors/lolfi-posads.ingestor';
import { LolfiTypeJuridictionIngestor } from './services/ingestors/lolfi-type-juridiction.ingestor';
import { LolfiArchiveIngestor } from './services/lolfi-archive-ingest';

@Module({
  imports: [JobsModule],
  controllers: [IngestController],
  exports: [IngestService],
  providers: [
    IngestService,
    LolfiArchiveIngestor,
    LolfiFilesIngestor,
    JobFileIngestor,
    LolfiTypeJuridictionIngestor,
    LolfiJuridictionIngestor,
    LolfiGradesIngestor,
    LolfiFonctionsIngestor,
    LolfiPosadsIngestor,
  ],
})
export class IngestModule {}
