import { FormattedMessage } from 'react-intl';
import { Link } from 'react-router';

import { GradeAndPosition } from '@/shared/components/GradeAndPosition';
import { getMagistratDetailsPath, getObservationDetailsPath } from '@/utils/route-path.utils';
import type { SessionObservation } from '@queries/observations.queries';

import { ObservationFollowUpTag } from './ObservationFollowUpTag';

// the cells of a row of observations, shared by the session tab and the observations tracking table

// the observant is repeated on each row of their bloc: each row opens its own observation
export function ObservantCell(props: { observation: SessionObservation; sessionId: string }) {
  const { id, nominationFile, observant } = props.observation;

  return (
    <div className="flex flex-col items-start gap-1 leading-6">
      {/* a flex item turns into a block, which draws the DSFR underline under its last line only */}
      <span>
        <Link
          className="fr-link fr-link--sm box-decoration-clone"
          to={getObservationDetailsPath({
            context: 'sg',
            nominationFileId: nominationFile.id,
            observationId: id,
            sessionId: props.sessionId,
          })}
        >
          {observant.name}
        </Link>
      </span>
      {observant.currentPosition && <span className="text-xs leading-6">{observant.currentPosition}</span>}
    </div>
  );
}

// as in the auditions tab: the profile icon marks a link to the magistrat page
export function ObservedCell(props: { observation: SessionObservation }) {
  const { magistrat } = props.observation.nominationFile;

  return (
    <div className="flex flex-col items-start gap-1 leading-6">
      {magistrat.id ? (
        <span>
          <Link
            className="fr-link fr-link--sm fr-icon-account-circle-fill fr-link--icon-left box-decoration-clone"
            to={getMagistratDetailsPath({ context: 'sg', magistratId: magistrat.id })}
          >
            {magistrat.name}
          </Link>
        </span>
      ) : (
        <span className="font-medium text-(--text-default-grey)">{magistrat.name}</span>
      )}
      <span className="text-xs leading-6">
        <GradeAndPosition boldGrade={false} grade={magistrat.grade} position={magistrat.currentPosition} />
      </span>
    </div>
  );
}

export function TargetedCell(props: { observation: SessionObservation }) {
  const { targeted } = props.observation.nominationFile;

  return (
    <span className="leading-6">
      <GradeAndPosition boldGrade={false} grade={targeted.grade} position={targeted.position} />
    </span>
  );
}

export function FollowUpCell(props: { observation: SessionObservation }) {
  return props.observation.followUp ? (
    <ObservationFollowUpTag followUp={props.observation.followUp} />
  ) : (
    <span className="text-(--text-mention-grey)">
      <FormattedMessage defaultMessage="Aucune" />
    </span>
  );
}
