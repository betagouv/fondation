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
          className="ml-1 before:m-0 before:content-['']"
          children={undefined as unknown as NonNullable<React.ReactNode>}
        />
      )}
    </>
  );
}
