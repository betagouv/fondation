import Badge from '@codegouvfr/react-dsfr/Badge';

import { useCountUsersNewSessionsQuery } from '@queries/nomination-sessions.queries';

export function ManageSessionsLink() {
  const { data } = useCountUsersNewSessionsQuery();

  return (
    <>
      <span>Gérer une session</span>
      {(data?.count ?? 0) > 0 && (
        <Badge
          severity="new"
          small
          className="fr-ml-1v before:m-0! before:content-['']"
          // oxlint-disable-next-line react/no-children-prop
          children={undefined as unknown as NonNullable<React.ReactNode>}
        />
      )}
    </>
  );
}
