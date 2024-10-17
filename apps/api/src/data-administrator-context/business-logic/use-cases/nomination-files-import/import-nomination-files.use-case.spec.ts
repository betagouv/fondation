import { Magistrat, NominationFile, Transparency } from '@/shared-models';
import { FakeNominationFileRepository } from 'src/data-administrator-context/adapters/secondary/gateways/repositories/fake-nomination-file-repository';
import { NominationFileRead } from '../../gateways/repositories/nomination-file-repository';
import { ImportNominationFilesUseCase } from './import-nomination-files.use-case';
import { FileLengthTooShortError } from '../../errors/file-length-too-short.error';
import { EmptyFileError } from '../../errors/empty-file.error';

describe('Import Nomination Files Use Case', () => {
  let nominationFileRepository: FakeNominationFileRepository;

  beforeEach(() => {
    nominationFileRepository = new FakeNominationFileRepository();
  });

  //     const fileToImport = `								Eléments du dossier								Règles automatisées de gestion (pour débat) et statutaires (bloquantes)													Règles statutaires (bloquantes) et éléments qualitatifs à vérifier dans le dossier
  // Point(s) d'attention(s) repéré(s) dans le dossier	N° dossier                                                   	Magistrat	Formation	Date d'échéance	Etat	Transparence	Rapporteur(s)	Grade actuel	Poste actuel	Poste pressenti	Rang	Date de naissance	Historique	Observants		Mutation en - de 3 ans	Passer au 1er grade	Passe au grade "HH"	Prendre son grade sur place	Poste "profilé"	Nomination à la CC	"Outremer sur Outremer"	Siège <> Parquet et TJ <> CA	Siège <> Parquet du même ressort	Siège <> Parquet d'une même juridiction	Prendre son grade sur place après 7 ans	Ministère de la Justice à - de 3 ans d'exercice		Cabinet du ministre	Inscription au tableau pour prise de grade	Accéder à la HH sans avoir fait 2 postes au 1er grade	Prof. jur. dans le ressort du TJ il y a - de 5 ans	Conflit d'intérêt avec parcours pré magistrature	Conflit d'intérêt avec la prof. d'un proche	Evaluations	Eléments disciplinaires	Conditions de nomination HH 		Point d'attention sur ce dossier ?	Grade actuel	Intitulé du poste actuel	Reformulation du poste actuel	Date de prise du poste actuel	Lieu d'exercice du poste actuel (nom de la juridiction)	Localisation du poste actuel (Métropole ou Outremer)	Cour d'appel de rattachement du poste actuel	Poste au Ministère ?	Grade du poste pressenti	Titre du poste pressenti	Poste profilé ?	Intitulé du poste pressenti	Reformulation du poste pressenti, sans le grade II	Reformulation du poste pressenti, sans les grades II et I	Reformulation du poste pressenti, sans les grades II, I et HH	Lieu d'exercice du poste pressenti (nom de la juridiction)	Localisation du poste pressenti (Métropole ou Outremer)	Cour d'appel de rattachement du poste pressenti	Date pour la prise de poste (si nomination confirmée)	Observations
  // TRUE	1 (parq.)	Marcel Dupont Ep. François 	Siège	10/11/2024	Nouveau	Automne 2024	LUCE Loïc MATHIS Rémi 	I	Avocat général - service extraordinaire CC  PARIS 	Premier avocat général CC  PARIS - HH 	(2 sur une liste de 2)	5/11/1961	- blablablablabla 	  JULES PASCAL VPI TJ PARIS (9 sur une liste de 11)		TRUE	FALSE	TRUE	TRUE	FALSE	TRUE	FALSE	FALSE	FALSE	FALSE	FALSE	FALSE		FALSE	TRUE	FALSE	TRUE	FALSE	FALSE	FALSE	FALSE	FALSE		TRUE	I	Avocat général - service extraordinaire CC  PARIS	Avocat	mars 2022	PARIS	Métropole	CA PARIS	FALSE	HH	Premier	FALSE	Premier avocat général CC  PARIS - HH	Premier avocat général CC  PARIS - HH	Premier avocat général CC  PARIS - HH	Premier avocat général CC  PARIS	PARIS	Métropole	CA PARIS	septembre 2024	  JEAN PASCAL VPI TJ PARIS (9 sur une liste de 11)
  // TRUE	2 (parq.)	Julien-Claude Servant 	Siège	01/12/2025	Avis restitué	Automne 2024	ELI Patrick PATRON Céline 	I	Substitut du procureur général CA  PARIS 	Avocat général CC  PARIS - HH 	(1 sur une liste de 2)	1/2/1975	- blablablablabla 	   		FALSE	FALSE	TRUE	TRUE	TRUE	TRUE	FALSE	FALSE	FALSE	FALSE	TRUE	FALSE		FALSE	TRUE	FALSE	FALSE	FALSE	FALSE	FALSE	FALSE	FALSE		TRUE	I	Substitut du procureur général CA  PARIS	Substitut	septembre 2016	PARIS	Métropole	CA PARIS	FALSE	HH	Avocat	TRUE	Avocat général CC  PARIS - HH	Avocat général CC  PARIS - HH	Avocat général CC  PARIS - HH	Avocat général CC  PARIS	PARIS	Métropole	CA PARIS	septembre 2024
  // TRUE	3 (parq.)	Lucien Pierre 	Siège		En cours	Automne 2024	VICTOIRE Christian MATHIEU Madeleine 	HH	Procureur de la République adjoint TJ  NIMES 	Avocat général CC  PARIS - HH 	2 sur une liste de 11)	22/8/1962	- blablablablabla 	   		FALSE	FALSE	FALSE	FALSE	FALSE	TRUE	FALSE	TRUE	FALSE	FALSE	FALSE	FALSE		FALSE	FALSE	FALSE	FALSE	FALSE	FALSE	FALSE	FALSE	FALSE		TRUE	HH	Procureur de la République adjoint TJ  NIMES	Procureur	septembre 2012	NIMES	Métropole	CA NIMES	FALSE	HH	Avocat	FALSE	Avocat général CC  PARIS - HH	Avocat général CC  PARIS - HH	Avocat général CC  PARIS - HH	Avocat général CC  PARIS	PARIS	Métropole	CA PARIS	septembre 2024
  // TRUE	2 (parq.)	Louise Elie Ep. Deneux 	Siège		Prêt à soutenir	Mars 2025	ELOUAN Patrick JEAN Pierre-Yves 	I	Vice-président chargé de l'instruction TJ  SAINT DENIS DE LA REUNION 	Avocat général CC  PARIS - HH 	1 sur une liste de 11)	21/9/1963	- blablablablabla 	   		FALSE	FALSE	TRUE	FALSE	FALSE	TRUE	FALSE	FALSE	FALSE	FALSE	FALSE	FALSE		FALSE	TRUE	FALSE	TRUE	FALSE	FALSE	FALSE	FALSE	FALSE		TRUE	I	Vice-président chargé de l'instruction TJ  SAINT DENIS DE LA REUNION	Vice-président	septembre 2019	REUNION	Outremer	CA SAINT DENIS DE LA REUNION	FALSE	HH	Avocat	FALSE	Avocat général CC  PARIS - HH	Avocat général CC  PARIS - HH	Avocat général CC  PARIS - HH	Avocat général CC  PARIS	PARIS	Métropole	CA PARIS	septembre 2024	   `;

  it.each([
    [{ fileToImport: `\t\t\t\t\t  `, expectedError: EmptyFileError }],
    [
      {
        fileToImport: `								Eléments du dossier								Règles automatisées de gestion (pour débat) et statutaires (bloquantes)													Règles statutaires (bloquantes) et éléments qualitatifs à vérifier dans le dossier
      Point(s) d'attention(s) repéré(s) dans le dossier	N° dossier                                                   	Magistrat	Formation	Date d'échéance	Etat	Transparence	Rapporteur(s)	Grade actuel	Poste actuel	Poste pressenti	Rang	Date de naissance	Historique	Observants		Mutation en - de 3 ans	Passer au 1er grade	Passe au grade "HH"	Prendre son grade sur place	Poste "profilé"	Nomination à la CC	"Outremer sur Outremer"	Siège <> Parquet et TJ <> CA	Siège <> Parquet du même ressort	Siège <> Parquet d'une même juridiction	Prendre son grade sur place après 7 ans	Ministère de la Justice à - de 3 ans d'exercice		Cabinet du ministre	Inscription au tableau pour prise de grade	Accéder à la HH sans avoir fait 2 postes au 1er grade	Prof. jur. dans le ressort du TJ il y a - de 5 ans	Conflit d'intérêt avec parcours pré magistrature	Conflit d'intérêt avec la prof. d'un proche	Evaluations	Eléments disciplinaires	Conditions de nomination HH 		Point d'attention sur ce dossier ?	Grade actuel	Intitulé du poste actuel	Reformulation du poste actuel	Date de prise du poste actuel	Lieu d'exercice du poste actuel (nom de la juridiction)	Localisation du poste actuel (Métropole ou Outremer)	Cour d'appel de rattachement du poste actuel	Poste au Ministère ?	Grade du poste pressenti	Titre du poste pressenti	Poste profilé ?	Intitulé du poste pressenti	Reformulation du poste pressenti, sans le grade II	Reformulation du poste pressenti, sans les grades II et I	Reformulation du poste pressenti, sans les grades II, I et HH	Lieu d'exercice du poste pressenti (nom de la juridiction)	Localisation du poste pressenti (Métropole ou Outremer)	Cour d'appel de rattachement du poste pressenti	Date pour la prise de poste (si nomination confirmée)	Observations`,
        expectedError: FileLengthTooShortError,
      },
    ],
  ])(
    'rejects a file with less than 3 lines',
    async ({ fileToImport, expectedError }) => {
      expect(
        new ImportNominationFilesUseCase(nominationFileRepository).execute(
          fileToImport,
        ),
      ).rejects.toThrow(expectedError);
    },
  );

  it('parses a line with all values filled and all rules pre-validated at true', async () => {
    const fileToImport = `								Eléments du dossier								Règles automatisées de gestion (pour débat) et statutaires (bloquantes)													Règles statutaires (bloquantes) et éléments qualitatifs à vérifier dans le dossier
      Point(s) d'attention(s) repéré(s) dans le dossier	N° dossier                                                   	Magistrat	Formation	Date d'échéance	Etat	Transparence	Rapporteur(s)	Grade actuel	Poste actuel	Poste pressenti	Rang	Date de naissance	Historique	Observants		Mutation en - de 3 ans	Passer au 1er grade	Passe au grade "HH"	Prendre son grade sur place	Poste "profilé"	Nomination à la CC	"Outremer sur Outremer"	Siège <> Parquet et TJ <> CA	Siège <> Parquet du même ressort	Siège <> Parquet d'une même juridiction	Prendre son grade sur place après 7 ans	Ministère de la Justice à - de 3 ans d'exercice		Cabinet du ministre	Inscription au tableau pour prise de grade	Accéder à la HH sans avoir fait 2 postes au 1er grade	Prof. jur. dans le ressort du TJ il y a - de 5 ans	Conflit d'intérêt avec parcours pré magistrature	Conflit d'intérêt avec la prof. d'un proche	Evaluations	Eléments disciplinaires	Conditions de nomination HH 		Point d'attention sur ce dossier ?	Grade actuel	Intitulé du poste actuel	Reformulation du poste actuel	Date de prise du poste actuel	Lieu d'exercice du poste actuel (nom de la juridiction)	Localisation du poste actuel (Métropole ou Outremer)	Cour d'appel de rattachement du poste actuel	Poste au Ministère ?	Grade du poste pressenti	Titre du poste pressenti	Poste profilé ?	Intitulé du poste pressenti	Reformulation du poste pressenti, sans le grade II	Reformulation du poste pressenti, sans les grades II et I	Reformulation du poste pressenti, sans les grades II, I et HH	Lieu d'exercice du poste pressenti (nom de la juridiction)	Localisation du poste pressenti (Métropole ou Outremer)	Cour d'appel de rattachement du poste pressenti	Date pour la prise de poste (si nomination confirmée)	Observations
      TRUE	1 (parq.)	Marcel Dupont Ep. François 	Siège	10/11/2024	Nouveau	Automne 2024	LUC Loïc 	I	Avocat général - service extraordinaire CC  PARIS 	Premier avocat général CC  PARIS - HH 	(2 sur une liste de 2)	1/11/1961	- blablablablabla 	  JEAN PASCAL VPI TJ PARIS (9 sur une liste de 11)		TRUE	TRUE	TRUE	TRUE	TRUE	TRUE	TRUE	TRUE	TRUE	TRUE	TRUE	TRUE		TRUE	TRUE	TRUE	TRUE	TRUE	TRUE	TRUE	TRUE	TRUE		TRUE	I	Avocat général - service extraordinaire CC  PARIS	Avocat	mars 2022	PARIS	Métropole	CA PARIS	FALSE	HH	Premier	FALSE	Premier avocat général CC  PARIS - HH	Premier avocat général I  PARIS - HH	Premier avocat général CC  PARIS - I	Premier avocat général CC  PARIS	PARIS	Métropole	CA PARIS	septembre 2024	  MATHIAS PASCAL VPI TJ PARIS (9 sur une liste de 11)`;

    await new ImportNominationFilesUseCase(nominationFileRepository).execute(
      fileToImport,
    );
    expect(
      nominationFileRepository.nominationFiles[0],
    ).toEqual<NominationFileRead>({
      content: {
        name: 'Marcel Dupont Ep. François',
        formation: Magistrat.Formation.SIEGE,
        dueDate: {
          year: 2024,
          month: 11,
          day: 10,
        },
        state: NominationFile.ReportState.NEW,
        transparency: Transparency.AUTOMNE_2024,
        reporter: 'LUC Loïc',
        grade: Magistrat.Grade.I,
        currentPosition: 'Avocat général - service extraordinaire CC  PARIS',
        targettedPosition: 'Premier avocat général CC  PARIS - HH',
        rank: '(2 sur une liste de 2)',
        birthDate: {
          year: 1961,
          month: 11,
          day: 1,
        },
        biography: '- blablablablabla',
        rules: getAllRulesPreValidated(),
      },
    });
  });

  it('parses a line with possible empty values unfilled and one rule pre-validated at true', async () => {
    const fileToImport = `								Eléments du dossier								Règles automatisées de gestion (pour débat) et statutaires (bloquantes)													Règles statutaires (bloquantes) et éléments qualitatifs à vérifier dans le dossier
      Point(s) d'attention(s) repéré(s) dans le dossier	N° dossier                                                   	Magistrat	Formation	Date d'échéance	Etat	Transparence	Rapporteur(s)	Grade actuel	Poste actuel	Poste pressenti	Rang	Date de naissance	Historique	Observants		Mutation en - de 3 ans	Passer au 1er grade	Passe au grade "HH"	Prendre son grade sur place	Poste "profilé"	Nomination à la CC	"Outremer sur Outremer"	Siège <> Parquet et TJ <> CA	Siège <> Parquet du même ressort	Siège <> Parquet d'une même juridiction	Prendre son grade sur place après 7 ans	Ministère de la Justice à - de 3 ans d'exercice		Cabinet du ministre	Inscription au tableau pour prise de grade	Accéder à la HH sans avoir fait 2 postes au 1er grade	Prof. jur. dans le ressort du TJ il y a - de 5 ans	Conflit d'intérêt avec parcours pré magistrature	Conflit d'intérêt avec la prof. d'un proche	Evaluations	Eléments disciplinaires	Conditions de nomination HH 		Point d'attention sur ce dossier ?	Grade actuel	Intitulé du poste actuel	Reformulation du poste actuel	Date de prise du poste actuel	Lieu d'exercice du poste actuel (nom de la juridiction)	Localisation du poste actuel (Métropole ou Outremer)	Cour d'appel de rattachement du poste actuel	Poste au Ministère ?	Grade du poste pressenti	Titre du poste pressenti	Poste profilé ?	Intitulé du poste pressenti	Reformulation du poste pressenti, sans le grade II	Reformulation du poste pressenti, sans les grades II et I	Reformulation du poste pressenti, sans les grades II, I et HH	Lieu d'exercice du poste pressenti (nom de la juridiction)	Localisation du poste pressenti (Métropole ou Outremer)	Cour d'appel de rattachement du poste pressenti	Date pour la prise de poste (si nomination confirmée)	Observations
      TRUE	3 (parq.)	Lucien Pierre 	Parquet		Avis restitué	Automne 2024	VICTOIRE Christian 	HH	Procureur de la République adjoint TJ  NIMES 	Avocat général CC  PARIS - HH 	2 sur une liste de 11)	22/8/1962	- blablablablabla 	   		TRUE	TRUE	TRUE	TRUE	TRUE	TRUE	TRUE	TRUE	TRUE	TRUE	TRUE	TRUE		FALSE	TRUE	TRUE	TRUE	TRUE	TRUE	TRUE	TRUE	TRUE		TRUE	HH	Procureur de la République adjoint TJ  NIMES	Procureur	septembre 2012	NIMES	Métropole	CA NIMES	FALSE	HH	Avocat	FALSE	Avocat général CC  PARIS - HH	Avocat général CC  PARIS - HH	Avocat général CC  PARIS - HH	Avocat général CC  PARIS	PARIS	Métropole	CA PARIS	septembre 2024`;

    await new ImportNominationFilesUseCase(nominationFileRepository).execute(
      fileToImport,
    );
    expect(
      nominationFileRepository.nominationFiles[0],
    ).toEqual<NominationFileRead>({
      content: {
        name: 'Lucien Pierre',
        formation: Magistrat.Formation.PARQUET,
        dueDate: null,
        state: NominationFile.ReportState.OPINION_RETURNED,
        transparency: Transparency.AUTOMNE_2024,
        reporter: 'VICTOIRE Christian',
        grade: Magistrat.Grade.HH,
        currentPosition: 'Procureur de la République adjoint TJ  NIMES',
        targettedPosition: 'Avocat général CC  PARIS - HH',
        rank: '2 sur une liste de 11)',
        birthDate: {
          year: 1962,
          month: 8,
          day: 22,
        },
        biography: '- blablablablabla',
        rules: getAllRulesPreValidated({ exceptRuleMinisterCabinet: true }),
      },
    });
  });
});

const getAllRulesPreValidated = (options?: {
  exceptRuleMinisterCabinet: true;
}): NominationFileRead['content']['rules'] => ({
  [NominationFile.RuleGroup.MANAGEMENT]: Object.values(
    NominationFile.ManagementRule,
  ).reduce(
    (acc, rule) => ({
      ...acc,
      [rule]: true,
    }),
    {} as NominationFileRead['content']['rules'][NominationFile.RuleGroup.MANAGEMENT],
  ),
  [NominationFile.RuleGroup.STATUTORY]: Object.values(
    NominationFile.StatutoryRule,
  ).reduce(
    (acc, rule) => ({
      ...acc,
      [rule]:
        options?.exceptRuleMinisterCabinet &&
        rule === NominationFile.StatutoryRule.MINISTER_CABINET
          ? false
          : true,
    }),
    {} as NominationFileRead['content']['rules'][NominationFile.RuleGroup.STATUTORY],
  ),
  [NominationFile.RuleGroup.QUALITATIVE]: Object.values(
    NominationFile.QualitativeRule,
  ).reduce(
    (acc, rule) => ({ ...acc, [rule]: true }),
    {} as NominationFileRead['content']['rules'][NominationFile.RuleGroup.QUALITATIVE],
  ),
});
