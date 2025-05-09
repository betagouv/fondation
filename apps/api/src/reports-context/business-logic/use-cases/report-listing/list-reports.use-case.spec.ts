import {
  Magistrat,
  NominationFile,
  ReportListItemQueried,
  ReportListItemVM,
  Transparency,
} from 'shared-models';
import { TypeDeSaisine } from 'src/nominations-context/business-logic/models/type-de-saisine';
import { DossierDeNominationDto } from '../../gateways/services/dossier-de-nomination.service';
import { SessionDto } from '../../gateways/services/session.service';
import { getDependencies } from '../../test-dependencies';
import { ListReportsUseCase } from './list-reports.use-case';

describe('List reports', () => {
  let dependencies: ReturnType<typeof getDependencies>;

  beforeEach(() => {
    dependencies = getDependencies();
    dependencies.stubDossierDeNominationService.stubDossier =
      unDossierDeNomination;
    dependencies.stubSessionService.stubSession = uneSession;
  });

  it("returns an empty list when there's no reports", async () => {
    await expectReports([]);
  });

  it('lists reports', async () => {
    givenUnRapportQueried(reporterId, unRapportQueried);
    await expectReports([unRapportVM]);
  });

  it("does not list reports that the user doesn't own", async () => {
    givenUnRapportQueried('another-reporter-id', unRapportAutreRapporteur);
    await expectReports([]);
  });

  const givenUnRapportQueried = (
    rapportId: string,
    rapportQueried: ReportListItemQueried,
  ) => {
    dependencies.fakeReportListingVMQuery.reportsList = {
      [rapportId]: [rapportQueried],
    };
  };

  const listReports = () =>
    new ListReportsUseCase(
      dependencies.fakeReportListingVMQuery,
      dependencies.stubDossierDeNominationService,
      dependencies.stubSessionService,
    ).execute(reporterId, uneSessionId);

  const expectReports = async (reports: ReportListItemVM[]) => {
    expect(await listReports()).toEqual({
      data: reports,
    });
  };
});

const reporterId = 'reporter-id';
const uneSessionId = 'une-session-id';
const unDossierDeNominationId = 'un-dossier-de-nomination-id';

const unRapportVM: ReportListItemVM = {
  id: '1',
  folderNumber: 15,
  state: NominationFile.ReportState.NEW,
  dueDate: {
    year: 2030,
    month: 10,
    day: 5,
  },
  formation: Magistrat.Formation.PARQUET,
  name: 'a name',
  transparency: Transparency.GRANDE_TRANSPA_DU_21_MARS_2025,
  grade: Magistrat.Grade.HH,
  targettedPosition: 'a position',
};

const unRapportQueried: ReportListItemQueried = {
  id: '1',
  sessionId: uneSessionId,
  dossierDeNominationId: unDossierDeNominationId,
  state: NominationFile.ReportState.NEW,
  formation: Magistrat.Formation.PARQUET,
};

const unRapportAutreRapporteur: ReportListItemQueried = {
  id: 'report-not-owned-id',
  sessionId: uneSessionId,
  dossierDeNominationId: unDossierDeNominationId,
  state: NominationFile.ReportState.NEW,
  formation: Magistrat.Formation.PARQUET,
};

const unDossierDeNomination: DossierDeNominationDto<TypeDeSaisine.TRANSPARENCE_GDS> =
  {
    id: unDossierDeNominationId,
    sessionId: uneSessionId,
    nominationFileImportedId: 'nomination-file-imported-id',
    content: {
      folderNumber: unRapportVM.folderNumber,
      name: unRapportVM.name,
      formation: unRapportVM.formation,
      dueDate: unRapportVM.dueDate,
      transparency: unRapportVM.transparency,
      reporters: [reporterId],
      grade: unRapportVM.grade,
      targettedPosition: unRapportVM.targettedPosition,
      currentPosition: 'a current position',
      birthDate: {
        year: 1980,
        month: 1,
        day: 1,
      },
      biography: 'a biography',
      rank: '1 sur 1',
      observers: ['a list of observers'],
    },
  };

const uneSession: SessionDto = {
  id: uneSessionId,
  typeDeSaisine: TypeDeSaisine.TRANSPARENCE_GDS,
  name: unRapportVM.transparency,
  formations: [unRapportVM.formation],
};
