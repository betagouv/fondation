import { useIntl } from 'react-intl';
import { Navigate, useOutletContext, useParams } from 'react-router';

import { CourtOfCassationHoldersTable } from '@/features/veille-des-postes/components/CourtOfCassationHoldersTable';
import { AttachedLinkTab, AttachedLinkTabs } from '@/shared/ui/link-tabs';

import {
  courtOfCassationPositionOf,
  courtOfCassationPositionPath,
  FIRST_COURT_OF_CASSATION_POSITION,
} from './court-of-cassation-position-paths';
import type { VeilleDesPostesOutletContext } from './veille-des-postes-outlet-context.type';

export function CourtOfCassationTab() {
  const { formatMessage } = useIntl();
  const { filtersSlot, titleSlot } = useOutletContext<VeilleDesPostesOutletContext>();
  const position = courtOfCassationPositionOf(useParams().position);

  if (!position)
    return <Navigate replace to={courtOfCassationPositionPath(FIRST_COURT_OF_CASSATION_POSITION)} />;

  return (
    <CourtOfCassationHoldersTable
      filtersSlot={filtersSlot}
      position={position}
      positionTabs={(positions) => (
        <AttachedLinkTabs ariaLabel={formatMessage({ defaultMessage: 'Postes de la Cour de cassation' })}>
          {positions.map(({ count, id, label }) => (
            <AttachedLinkTab
              count={count}
              keepsQuery
              key={id}
              label={label}
              to={courtOfCassationPositionPath(id)}
            />
          ))}
        </AttachedLinkTabs>
      )}
      titleSlot={titleSlot}
    />
  );
}
