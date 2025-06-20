import { ReportRetrievalVM, TypeDeSaisine } from 'shared-models';
import { ReportRetrievalQueried } from '../../gateways/queries/report-retrieval-vm.query';
import { PropositionDeNominationTransparenceV1Dto } from '../../gateways/services/dossier-de-nomination.service';
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
  .with('dureeDuPoste', '4 ans et 5 mois')
  .buildVM();

const unDossierDeNomination: PropositionDeNominationTransparenceV1Dto = {
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
    datePassageAuGrade: { day: 15, month: 5, year: 2024 },
    datePriseDeFonctionPosteActuel: { day: 10, month: 5, year: 2020 },
    informationCarrière: "20 ans d'expérience dans la magistrature",
  },
};

const uneSession: SessionDto<TypeDeSaisine.TRANSPARENCE_GDS> = {
  id: uneSessionId,
  typeDeSaisine: TypeDeSaisine.TRANSPARENCE_GDS,
  name: aReportVM.transparency,
  formation: aReportVM.formation,
  sessionImportéeId: 'data-administration-import-id',
  version: 1,
  content: {
    dateTransparence: {
      year: 2025,
      month: 3,
      day: 21,
    },
    dateClôtureDélaiObservation: {
      year: 2025,
      month: 3,
      day: 28,
    },
  },
};
