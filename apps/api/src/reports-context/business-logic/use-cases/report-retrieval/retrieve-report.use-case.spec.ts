import { ReportRetrievalVM } from 'shared-models';
import { TypeDeSaisine } from 'src/nominations-context/business-logic/models/type-de-saisine';
import { ReportRetrievalQueried } from '../../gateways/queries/report-retrieval-vm.query';
import { DossierDeNominationDto } from '../../gateways/services/dossier-de-nomination.service';
import { SessionDto } from '../../gateways/services/session.service';
import { ReportAttachedFileBuilder } from '../../models/report-attached-file.builder';
import { ReportRetrievalBuilder } from '../../models/report-retrieval-vm.builder';
import { getDependencies } from '../../test-dependencies';

const reporterId = 'reporter-id';

describe('Report Retrieval', () => {
  let dependencies: ReturnType<typeof getDependencies>;

  beforeEach(() => {
    dependencies = getDependencies();
    dependencies.stubDossierDeNominationService.stubDossier =
      unDossierDeNomination;
    dependencies.stubSessionService.stubSession = uneSession;
  });

  beforeEach(() => {
    dependencies.fakeReportRetrievalVMQuery.reports = {
      [aReportQueried.id]: aReportQueried,
    };
  });

  it('retrieves a report', async () => {
    expect(
      await dependencies.retrieveReportUseCase.execute(
        aReportQueried.id,
        reporterId,
      ),
    ).toEqual(aReportVM);
  });
});

const uneSessionId = 'une-session-id';
const unDossierDeNominationId = 'un-dossier-de-nomination-id';

const aFile = new ReportAttachedFileBuilder().build();
const aReportQueried = new ReportRetrievalBuilder<ReportRetrievalQueried>()
  .with('files', [aFile])
  .with('dossierDeNominationId', unDossierDeNominationId)
  .with('sessionId', uneSessionId)
  .buildQueried();
const aReportVM = new ReportRetrievalBuilder<ReportRetrievalVM>()
  .with('attachedFiles', [
    {
      usage: aFile.usage,
      name: aFile.name,
      fileId: aFile.fileId,
    },
  ])
  .buildVM();

const unDossierDeNomination: DossierDeNominationDto<TypeDeSaisine.TRANSPARENCE_GDS> =
  {
    id: unDossierDeNominationId,
    sessionId: uneSessionId,
    nominationFileImportedId: 'nomination-file-imported-id',
    content: {
      folderNumber: aReportVM.folderNumber,
      name: aReportVM.name,
      formation: aReportVM.formation,
      dueDate: aReportVM.dueDate,
      grade: aReportVM.grade,
      targettedPosition: aReportVM.targettedPosition,
      currentPosition: aReportVM.currentPosition,
      birthDate: aReportVM.birthDate,
      biography: aReportVM.biography,
      rank: aReportVM.rank,
      observers: aReportVM.observers,
    },
  };

const uneSession: SessionDto = {
  id: uneSessionId,
  typeDeSaisine: TypeDeSaisine.TRANSPARENCE_GDS,
  name: aReportVM.transparency,
  formations: [aReportVM.formation],
};
