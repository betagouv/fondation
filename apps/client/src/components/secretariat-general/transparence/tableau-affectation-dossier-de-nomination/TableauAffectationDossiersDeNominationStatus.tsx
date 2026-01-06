import Badge from '@codegouvfr/react-dsfr/Badge';
import { useDetailedNominationSessionAffectationsVersionQuery } from '@queries/nomination-sessions.queries';

export function TableauAffectationDossierDeNominationStatus(props: { sessionId: string }) {
  const { data: affectationsVersion } = useDetailedNominationSessionAffectationsVersionQuery(props.sessionId);

  if (!affectationsVersion) return null;

  const isBrouillon = affectationsVersion?.status === 'BROUILLON';

  return (
    <div className={'mb-4 flex flex-col gap-2'}>
      <Badge severity={isBrouillon ? 'info' : 'success'}>
        {isBrouillon ? 'Brouillon' : 'Publiée'}
        {affectationsVersion.version > 1 && ` - Version ${affectationsVersion.version}`}
      </Badge>
    </div>
  );
}
