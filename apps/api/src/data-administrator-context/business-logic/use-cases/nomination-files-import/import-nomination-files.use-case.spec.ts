import { FakeNominationFileRepository } from 'src/data-administrator-context/adapters/secondary/gateways/repositories/fake-nomination-file-repository';
import { ImportNominationFilesUseCase } from './import-nomination-files.use-case';
import { TsvHeaderColumnMismatchError } from '../../errors/tsv-header-column-mismatch.error';
import { DateOnly } from 'src/shared-kernel/business-logic/models/date-only';
import { NominationFileRead } from '../../gateways/repositories/nomination-file-repository';

describe('Import Nomination Files Use Case', () => {
  let nominationFileRepository: FakeNominationFileRepository;

  beforeEach(() => {
    nominationFileRepository = new FakeNominationFileRepository();
  });

  describe('First Header', () => {
    it('rejects invalid first header', async () => {
      //     const fileToImport = `								Eléments du dossier								Règles automatisées de gestion (pour débat) et statutaires (bloquantes)													Règles statutaires (bloquantes) et éléments qualitatifs à vérifier dans le dossier
      // Point(s) d'attention(s) repéré(s) dans le dossier	N° dossier                                                   	Magistrat	Formation	Date d'échéance	Etat	Transparence	Rapporteur(s)	Grade actuel	Poste actuel	Poste pressenti	Rang	Date de naissance	Historique	Observants		Mutation en - de 3 ans	Passer au 1er grade	Passe au grade "HH"	Prendre son grade sur place	Poste "profilé"	Nomination à la CC	"Outremer sur Outremer"	Siège <> Parquet et TJ <> CA	Siège <> Parquet du même ressort	Siège <> Parquet d'une même juridiction	Prendre son grade sur place après 7 ans	Ministère de la Justice à - de 3 ans d'exercice		Cabinet du ministre	Inscription au tableau pour prise de grade	Accéder à la HH sans avoir fait 2 postes au 1er grade	Prof. jur. dans le ressort du TJ il y a - de 5 ans	Conflit d'intérêt avec parcours pré magistrature	Conflit d'intérêt avec la prof. d'un proche	Evaluations	Eléments disciplinaires	Conditions de nomination HH 		Point d'attention sur ce dossier ?	Grade actuel	Intitulé du poste actuel	Reformulation du poste actuel	Date de prise du poste actuel	Lieu d'exercice du poste actuel (nom de la juridiction)	Localisation du poste actuel (Métropole ou Outremer)	Cour d'appel de rattachement du poste actuel	Poste au Ministère ?	Grade du poste pressenti	Titre du poste pressenti	Poste profilé ?	Intitulé du poste pressenti	Reformulation du poste pressenti, sans le grade II	Reformulation du poste pressenti, sans les grades II et I	Reformulation du poste pressenti, sans les grades II, I et HH	Lieu d'exercice du poste pressenti (nom de la juridiction)	Localisation du poste pressenti (Métropole ou Outremer)	Cour d'appel de rattachement du poste pressenti	Date pour la prise de poste (si nomination confirmée)	Observations
      // TRUE	1 (parq.)	Marcel Dupont Ep. François 	Siège	10/11/2024	Nouveau	Automne 2024	LUCE Loïc MATHIS Rémi 	I	Avocat général - service extraordinaire CC  PARIS 	Premier avocat général CC  PARIS - HH 	(2 sur une liste de 2)	5/11/1961	- blablablablabla 	  JULES PASCAL VPI TJ PARIS (9 sur une liste de 11)		TRUE	FALSE	TRUE	TRUE	FALSE	TRUE	FALSE	FALSE	FALSE	FALSE	FALSE	FALSE		FALSE	TRUE	FALSE	TRUE	FALSE	FALSE	FALSE	FALSE	FALSE		TRUE	I	Avocat général - service extraordinaire CC  PARIS	Avocat	mars 2022	PARIS	Métropole	CA PARIS	FALSE	HH	Premier	FALSE	Premier avocat général CC  PARIS - HH	Premier avocat général CC  PARIS - HH	Premier avocat général CC  PARIS - HH	Premier avocat général CC  PARIS	PARIS	Métropole	CA PARIS	septembre 2024	  JEAN PASCAL VPI TJ PARIS (9 sur une liste de 11)
      // TRUE	2 (parq.)	Julien-Claude Servant 	Siège	01/12/2025	Avis restitué	Automne 2024	ELI Patrick PATRON Céline 	I	Substitut du procureur général CA  PARIS 	Avocat général CC  PARIS - HH 	(1 sur une liste de 2)	1/2/1975	- blablablablabla 	   		FALSE	FALSE	TRUE	TRUE	TRUE	TRUE	FALSE	FALSE	FALSE	FALSE	TRUE	FALSE		FALSE	TRUE	FALSE	FALSE	FALSE	FALSE	FALSE	FALSE	FALSE		TRUE	I	Substitut du procureur général CA  PARIS	Substitut	septembre 2016	PARIS	Métropole	CA PARIS	FALSE	HH	Avocat	TRUE	Avocat général CC  PARIS - HH	Avocat général CC  PARIS - HH	Avocat général CC  PARIS - HH	Avocat général CC  PARIS	PARIS	Métropole	CA PARIS	septembre 2024
      // TRUE	3 (parq.)	Lucien Pierre 	Siège		En cours	Automne 2024	VICTOIRE Christian MATHIEU Madeleine 	HH	Procureur de la République adjoint TJ  NIMES 	Avocat général CC  PARIS - HH 	2 sur une liste de 11)	22/8/1962	- blablablablabla 	   		FALSE	FALSE	FALSE	FALSE	FALSE	TRUE	FALSE	TRUE	FALSE	FALSE	FALSE	FALSE		FALSE	FALSE	FALSE	FALSE	FALSE	FALSE	FALSE	FALSE	FALSE		TRUE	HH	Procureur de la République adjoint TJ  NIMES	Procureur	septembre 2012	NIMES	Métropole	CA NIMES	FALSE	HH	Avocat	FALSE	Avocat général CC  PARIS - HH	Avocat général CC  PARIS - HH	Avocat général CC  PARIS - HH	Avocat général CC  PARIS	PARIS	Métropole	CA PARIS	septembre 2024
      // TRUE	2 (parq.)	Louise Elie Ep. Deneux 	Siège		Prêt à soutenir	Mars 2025	ELOUAN Patrick JEAN Pierre-Yves 	I	Vice-président chargé de l'instruction TJ  SAINT DENIS DE LA REUNION 	Avocat général CC  PARIS - HH 	1 sur une liste de 11)	21/9/1963	- blablablablabla 	   		FALSE	FALSE	TRUE	FALSE	FALSE	TRUE	FALSE	FALSE	FALSE	FALSE	FALSE	FALSE		FALSE	TRUE	FALSE	TRUE	FALSE	FALSE	FALSE	FALSE	FALSE		TRUE	I	Vice-président chargé de l'instruction TJ  SAINT DENIS DE LA REUNION	Vice-président	septembre 2019	REUNION	Outremer	CA SAINT DENIS DE LA REUNION	FALSE	HH	Avocat	FALSE	Avocat général CC  PARIS - HH	Avocat général CC  PARIS - HH	Avocat général CC  PARIS - HH	Avocat général CC  PARIS	PARIS	Métropole	CA PARIS	septembre 2024	   `;

      expect(
        new ImportNominationFilesUseCase(nominationFileRepository).execute(
          [
            'Mauvais header',
            'Règles automatisées de gestion (pour débat) et statutaires (bloquantes)',
            'Règles statutaires (bloquantes) et éléments qualitatifs à vérifier dans le dossier',
          ].join('\t'),
        ),
      ).rejects.toThrow(TsvHeaderColumnMismatchError);
    });

    it('validates first header', async () => {
      expect(
        await new ImportNominationFilesUseCase(
          nominationFileRepository,
        ).execute(
          [
            'Eléments du dossier',
            'Règles automatisées de gestion (pour débat) et statutaires (bloquantes)',
            'Règles statutaires (bloquantes) et éléments qualitatifs à vérifier dans le dossier',
          ].join('\t'),
        ),
      ).toBeUndefined();
    });

    it('removes unused tabs symbols', async () => {
      const fileToImport = [
        '\t\tEléments du dossier',
        '\t\t\t\t\tRègles automatisées de gestion (pour débat) et statutaires (bloquantes)',
        '\t\t\t\t\tRègles statutaires (bloquantes) et éléments qualitatifs à vérifier dans le dossier',
        '\t\t',
      ].join('\t');
      expect(
        await new ImportNominationFilesUseCase(
          nominationFileRepository,
        ).execute(fileToImport),
      ).toBeUndefined();
    });
  });

  describe('Content', () => {
    it('parses a line', async () => {
      const fileToImport = `								Eléments du dossier								Règles automatisées de gestion (pour débat) et statutaires (bloquantes)													Règles statutaires (bloquantes) et éléments qualitatifs à vérifier dans le dossier
      Point(s) d'attention(s) repéré(s) dans le dossier	N° dossier                                                   	Magistrat	Formation	Date d'échéance	Etat	Transparence	Rapporteur(s)	Grade actuel	Poste actuel	Poste pressenti	Rang	Date de naissance	Historique	Observants		Mutation en - de 3 ans	Passer au 1er grade	Passe au grade "HH"	Prendre son grade sur place	Poste "profilé"	Nomination à la CC	"Outremer sur Outremer"	Siège <> Parquet et TJ <> CA	Siège <> Parquet du même ressort	Siège <> Parquet d'une même juridiction	Prendre son grade sur place après 7 ans	Ministère de la Justice à - de 3 ans d'exercice		Cabinet du ministre	Inscription au tableau pour prise de grade	Accéder à la HH sans avoir fait 2 postes au 1er grade	Prof. jur. dans le ressort du TJ il y a - de 5 ans	Conflit d'intérêt avec parcours pré magistrature	Conflit d'intérêt avec la prof. d'un proche	Evaluations	Eléments disciplinaires	Conditions de nomination HH 		Point d'attention sur ce dossier ?	Grade actuel	Intitulé du poste actuel	Reformulation du poste actuel	Date de prise du poste actuel	Lieu d'exercice du poste actuel (nom de la juridiction)	Localisation du poste actuel (Métropole ou Outremer)	Cour d'appel de rattachement du poste actuel	Poste au Ministère ?	Grade du poste pressenti	Titre du poste pressenti	Poste profilé ?	Intitulé du poste pressenti	Reformulation du poste pressenti, sans le grade II	Reformulation du poste pressenti, sans les grades II et I	Reformulation du poste pressenti, sans les grades II, I et HH	Lieu d'exercice du poste pressenti (nom de la juridiction)	Localisation du poste pressenti (Métropole ou Outremer)	Cour d'appel de rattachement du poste pressenti	Date pour la prise de poste (si nomination confirmée)	Observations
      TRUE	1 (parq.)	Marcel Dupont Ep. François 	Siège	10/11/2024	Nouveau	Automne 2024	LUC Loïc LUCIEN Rémi 	I	Avocat général - service extraordinaire CC  PARIS 	Premier avocat général CC  PARIS - HH 	(2 sur une liste de 2)	1/11/1961	- blablablablabla 	  JEAN PASCAL VPI TJ PARIS (9 sur une liste de 11)		TRUE	FALSE	TRUE	TRUE	FALSE	TRUE	FALSE	FALSE	FALSE	FALSE	FALSE	FALSE		FALSE	TRUE	FALSE	TRUE	FALSE	FALSE	FALSE	FALSE	FALSE		TRUE	I	Avocat général - service extraordinaire CC  PARIS	Avocat	mars 2022	PARIS	Métropole	CA PARIS	FALSE	HH	Premier	FALSE	Premier avocat général CC  PARIS - HH	Premier avocat général I  PARIS - HH	Premier avocat général CC  PARIS - I	Premier avocat général CC  PARIS	PARIS	Métropole	CA PARIS	septembre 2024	  MATHIAS PASCAL VPI TJ PARIS (9 sur une liste de 11)`;

      await new ImportNominationFilesUseCase(nominationFileRepository).execute(
        fileToImport,
      );
      expect(
        nominationFileRepository.nominationFiles[0],
      ).toEqual<NominationFileRead>({
        content: {
          dueDate: new DateOnly(2024, 11, 10),
          birthDate: new DateOnly(1961, 11, 1),
        },
      });
    });
  });
});
