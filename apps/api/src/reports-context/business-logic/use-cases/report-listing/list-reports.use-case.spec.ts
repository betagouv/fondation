import {
  DateOnlyJson,
  Magistrat,
  NominationFile,
  ReportListItemQueried,
  ReportListItemVM,
  Transparency,
  TypeDeSaisine,
} from 'shared-models';
import { PropositionDeNominationTransparenceV1Dto } from '../../../../shared-kernel/business-logic/gateways/services/dossier-de-nomination.service';
import { TransparenceDto } from '../../../../shared-kernel/business-logic/gateways/services/session.service';
import { getDependencies } from '../../test-dependencies';
import { ListReportsUseCase } from './list-reports.use-case';

describe('List reports', () => {
  let dependencies: ReturnType<typeof getDependencies>;

  beforeEach(() => {
    dependencies = getDependencies();
    dependencies.stubDossierDeNominationService.stubDossier =
      unDossierDeNomination;
    dependencies.stubSessionService.stubSession = uneTransparence;
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
    ).execute(reporterId);

  const expectReports = async (reports: ReportListItemVM[]) => {
    expect(await listReports()).toEqual({
      data: reports,
    });
  };
});

const reporterId = 'reporter-id';
const uneSessionId = 'une-session-id';
const unDossierDeNominationId = 'un-dossier-de-nomination-id';
const uneDateTransparence: DateOnlyJson = {
  year: 2025,
  month: 3,
  day: 21,
};

const unRapportVM: ReportListItemVM = {
  id: '1',
  sessionId: uneSessionId,
  sessionImportId: 'session-importée-id',
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
  observersCount: 1,
  dateTransparence: uneDateTransparence,
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

const unDossierDeNomination: PropositionDeNominationTransparenceV1Dto = {
  id: unDossierDeNominationId,
  sessionId: uneSessionId,
  nominationFileImportedId: 'nomination-file-imported-id',
  content: {
    folderNumber: unRapportVM.folderNumber,
    name: unRapportVM.name,
    formation: unRapportVM.formation,
    dueDate: unRapportVM.dueDate,
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
    datePassageAuGrade: null,
    datePriseDeFonctionPosteActuel: null,
    informationCarrière: null,
  },
};

const uneTransparence: TransparenceDto = {
  id: uneSessionId,
  typeDeSaisine: TypeDeSaisine.TRANSPARENCE_GDS,
  name: unRapportVM.transparency,
  formation: unRapportVM.formation,
  sessionImportéeId: 'session-importée-id',
  version: 1,
  content: {
    dateTransparence: uneDateTransparence,
    dateClôtureDélaiObservation: {
      year: 2025,
      month: 3,
      day: 28,
    },
  },
};
