import { TypeDeSaisine } from 'shared-models';
import {
  AffectationRapporteursCréeEvent,
  AffectationRapporteursCréeEventPayload,
} from 'src/nominations-context/business-logic/models/events/affectation-rapporteurs-crée.event';
import {
  AffectationRapporteursModifiéeEvent,
  AffectationRapporteursModifiéeEventPayload,
} from 'src/nominations-context/business-logic/models/events/affectation-rapporteurs-modifiée.event';
import { currentDate, getDependencies } from '../../../../tests-dependencies';
import { AffectationSnapshot } from '../../../models/affectation';
import { ImportNouveauxDossiersTransparenceCommand } from '../import-nouveaux-dossiers-transparence.command';
import {
  aParquetCommand,
  aSecondSiègeCommand,
  givenSomeUuids,
  givenUneAffectationSiège,
  givenUneSession,
  givenUneSessionSiège,
  importNouveauxDossiersUseCase,
  lucLoïcUser,
  uneAffectationParquet,
  uneAffectationSiègeAvecDeuxDossiers,
  uneAffectionSiège,
} from './import-nouveaux-dossiers-transparence.tests-setup';

describe('Affectation des rapporteurs de transparence au format tsv', () => {
  let dependencies: ReturnType<typeof getDependencies>;

  beforeEach(() => {
    dependencies = getDependencies();

    givenSomeUuids(dependencies.uuidGenerator);
    givenUneSession(dependencies.sessionRepository);
    givenUneAffectationSiège(dependencies.affectationRepository);
    dependencies.userService.addUsers(lucLoïcUser);
  });

  it("informe que l'affectation a été créée", async () => {
    await créerAffectationRapporteurs(aParquetCommand);
    expectDomainEvent(1, AffectationRapporteursCréeEvent.name, {
      ...uneAffectationParquet,
      typeDeSaisine: TypeDeSaisine.TRANSPARENCE_GDS,
    });
  });

  it('crée une affectation "Parquet" des rapporteurs aux dossiers de nominations', async () => {
    await créerAffectationRapporteurs(aParquetCommand);
    expectAffectationRapporteursCréée(uneAffectionSiège, uneAffectationParquet);
  });

  describe('Affectation "Siège" modifiée', () => {
    beforeEach(() => {
      givenUneSessionSiège(dependencies.sessionRepository);
    });

    it("informe que l'affectation a été modifiée", async () => {
      await créerAffectationRapporteurs(aSecondSiègeCommand);
      expectDomainEvent(1, AffectationRapporteursModifiéeEvent.name, {
        ...uneAffectationSiègeAvecDeuxDossiers,
        typeDeSaisine: TypeDeSaisine.TRANSPARENCE_GDS,
        affectationsDossiersDeNominations: [
          uneAffectationSiègeAvecDeuxDossiers
            .affectationsDossiersDeNominations[1]!,
        ],
      });
    });

    it("ajoute un dossier à l'affectation 'Siège' existante", async () => {
      await créerAffectationRapporteurs(aSecondSiègeCommand);
      expectAffectationRapporteursCréée(uneAffectationSiègeAvecDeuxDossiers);
    });
  });

  const créerAffectationRapporteurs = (
    command?: ImportNouveauxDossiersTransparenceCommand,
  ) => importNouveauxDossiersUseCase(dependencies, command);

  const expectAffectationRapporteursCréée = (
    ...affectations: AffectationSnapshot[]
  ) =>
    expect(dependencies.affectationRepository.getAffectations()).toEqual<
      AffectationSnapshot[]
    >(affectations);

  const expectDomainEvent = (
    index: number,
    name: string,
    payload:
      | AffectationRapporteursModifiéeEventPayload
      | AffectationRapporteursCréeEventPayload,
  ) => {
    const event = dependencies.domainEventRepository.events[index]!;
    expect(event.type).toEqual(name);
    expect(event.payload).toEqual(payload);
    expect(event.occurredOn).toEqual(currentDate);
  };
});
