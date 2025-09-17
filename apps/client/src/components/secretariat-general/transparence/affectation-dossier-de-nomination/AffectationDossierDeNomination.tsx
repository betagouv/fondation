import { useParams } from 'react-router-dom';
import { useGetDossierDeNominationParSession } from '../../../../react-query/queries/sg/get-dossier-de-nomination-par-session.query';
import { colors } from '@codegouvfr/react-dsfr/fr/colors';
import type { ContenuPropositionDeNominationTransparenceV2 } from 'shared-models/models/session/contenu-transparence-par-version/proposition-content';
import Table from '@codegouvfr/react-dsfr/Table';

const TABLE_HEADER = [
  'N°',
  'Magistrat',
  'Poste actuel',
  'Grade actuel',
  'Poste cible',
  'Observants',
  'Priorité',
  'Rapporteur(s)'
];

export const AffectationDossierDeNomination = () => {
  const { sessionId } = useParams();
  const {
    data: dossiersDeNomination,
    isLoading: isLoadingDossiersDeNomination,
    isError: isErrorDossiersDeNomination
  } = useGetDossierDeNominationParSession({
    sessionId: sessionId as string
  });

  const dataRows = (dossiersDeNomination || []).map((dossier) => {
    const content = dossier.content as ContenuPropositionDeNominationTransparenceV2;
    return [
      content.numeroDeDossier,
      content.nomMagistrat,
      content.posteActuel,
      content.grade,
      content.posteCible,
      content.observants,
      'priorité',
      'rapporteurs'
    ];
  });

  return (
    <div id="session-affectation-dossier-de-nomination">
      {isLoadingDossiersDeNomination && <div>Chargement des dossiers de nomination...</div>}
      {isErrorDossiersDeNomination && (
        <div style={{ color: colors.options.error._425_625.default }}>
          Erreur lors de la récupération des dossiers de nomination
        </div>
      )}
      {!isLoadingDossiersDeNomination && (
        <Table
          id="session-affectation-dossier-de-nomination-table"
          bordered
          headers={TABLE_HEADER}
          data={dataRows}
        />
      )}
    </div>
  );
};
