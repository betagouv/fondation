import { Module } from '@nestjs/common';
import { IngestController } from './infrastructure/ingest.controller';
import { IngestService } from './infrastructure/ingest.service';
import { JobsModule } from './jobs/jobs.module';
import { JobFileIngestor } from './services/ingestors/job-file-ingestor';
import { LolfiCandidatsIngestor } from './services/ingestors/lolfi-candidats.ingestor';
import { LolfiDesiderataIngestor } from './services/ingestors/lolfi-desiderata.ingestor';
import { LolfiFilesIngestor } from './services/ingestors/lolfi-files.ingestor';
import { LolfiFonctionsIngestor } from './services/ingestors/lolfi-fonctions.ingestor';
import { LolfiGradesIngestor } from './services/ingestors/lolfi-grades.ingestor';
import { LolfiJuridictionIngestor } from './services/ingestors/lolfi-juridiction.ingestor';
import { LolfiMagistratsIngestor } from './services/ingestors/lolfi-magistrats.ingestor';
import { LolfiPosadsIngestor } from './services/ingestors/lolfi-posads.ingestor';
import { LolfiPostesIngestor } from './services/ingestors/lolfi-postes.ingestor';
import { LolfiSessionsIngestor } from './services/ingestors/lolfi-sessions.ingestor';
import { LolfiTransparencesIngestor } from './services/ingestors/lolfi-transparences.ingestor';
import { LolfiTypeJuridictionIngestor } from './services/ingestors/lolfi-type-juridiction.ingestor';
import { LolfiArchiveIngestor } from './services/lolfi-archive-ingest';
import { LolfiCryptoService } from './services/lolfi-crypto.service';

@Module({
  imports: [JobsModule],
  controllers: [IngestController],
  exports: [IngestService],
  providers: [
    IngestService,
    LolfiArchiveIngestor,
    LolfiFilesIngestor,
    JobFileIngestor,
    LolfiCandidatsIngestor,
    LolfiCryptoService,
    LolfiDesiderataIngestor,
    LolfiFonctionsIngestor,
    LolfiGradesIngestor,
    LolfiJuridictionIngestor,
    LolfiMagistratsIngestor,
    LolfiPosadsIngestor,
    LolfiPostesIngestor,
    LolfiSessionsIngestor,
    LolfiTransparencesIngestor,
    LolfiTypeJuridictionIngestor,
  ],
})
export class IngestModule {}
