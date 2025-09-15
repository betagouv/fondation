import Table from '@codegouvfr/react-dsfr/Table';
import { useGetSessions } from '../../../react-query/queries/sg/get-sessions.query';
import type { ReactNode } from 'react';
import { ROUTE_PATHS } from '../../../utils/route-path.utils';
import { Breadcrumb } from '../../shared/Breadcrumb';
import type { BreadcrumbVM } from '../../../models/breadcrumb-vm.model';
import { useNavigate } from 'react-router-dom';
import { TypeDeSaisine, TypeDeSaisineLabels, type SessionContent } from 'shared-models';
import { DateOnly } from '../../../models/date-only.model';

export const ManageSession = () => {
  const navigate = useNavigate();
  const { data: sessions } = useGetSessions();

  const headers: ReactNode[] = ['Type de saisine', 'Formation', 'Nom', 'Date'];

  const sessionRows = (sessions || [])?.map((session) => {
    const { name, formation, typeDeSaisine, sessionImportéeId } = session;
    const href = ROUTE_PATHS.SG.TRANSPARENCE_ID.replace(':id', sessionImportéeId);
    const content = session.content as SessionContent<TypeDeSaisine.TRANSPARENCE_GDS>;
    const dateTransparence = DateOnly.fromDateOnly(content.dateTransparence);
    return [
      TypeDeSaisineLabels[typeDeSaisine],
      formation,
      <a href={href}>{name.toUpperCase()}</a>,
      dateTransparence
    ];
  });

  const breadcrumb: BreadcrumbVM = {
    currentPageLabel: 'Gérer une session',
    segments: [
      {
        label: 'Secretariat général',
        href: ROUTE_PATHS.SG.DASHBOARD,
        onClick: (event: React.MouseEvent<HTMLAnchorElement>) => {
          event.preventDefault();
          navigate(ROUTE_PATHS.SG.DASHBOARD);
        }
      }
    ]
  };

  return (
    <>
      <Breadcrumb
        id="manage-sessions-breadcrumb"
        ariaLabel="Fil d'Ariane de la gestion des sessions"
        breadcrumb={breadcrumb}
      />
      <div className={'flex justify-center'}>
        <Table id="all-sessions-table" bordered headers={headers} data={sessionRows} />
      </div>
    </>
  );
};
