import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import clsx from 'clsx';
import React from 'react';
import { Link } from 'react-router';

import { getObservationDetailsPath } from '../../utils/route-path.utils';

export function ObservationLinks(props: {
  context?: 'sg' | 'membre';
  sessionId: string;
  nominationFile: {
    id: string;
    name: string;
    legacyObservers: readonly string[];
    observations: {
      id: string;
      hasDescription: boolean;
      hasUserComment: boolean;
      magistrat: { id: string; firstName: string; lastName: string } | null;
    }[];
  };
}) {
  return (
    <div className="flex flex-col gap-1">
      {props.nominationFile.legacyObservers.length > 0 && (
        <div className="text-sm">
          <span className="font-medium text-gray-600">LODAM: </span>
          <span>{props.nominationFile.legacyObservers.join(', ')}</span>
        </div>
      )}

      {props.nominationFile.observations.length > 0 && (
        <div className="text-sm">
          <span>
            {props.nominationFile.observations.map((obs, i) => (
              <React.Fragment key={obs.id}>
                {i > 0 ? <span>, </span> : null}
                <Link
                  key={obs.id}
                  className="text-blue-600"
                  to={getObservationDetailsPath({
                    context: props.context ?? 'sg',
                    sessionId: props.sessionId,
                    nominationFileId: props.nominationFile.id,
                    observationId: obs.id,
                  })}
                >
                  {obs.magistrat?.firstName} {obs.magistrat?.lastName}
                  {(obs.hasDescription || obs.hasUserComment) && (
                    <i className={clsx(cx('ri-message-3-line'), 'ml-1')} />
                  )}
                </Link>
              </React.Fragment>
            ))}
          </span>
        </div>
      )}

      {!props.nominationFile.legacyObservers?.length && !props.nominationFile.observations?.length ? (
        <span className="text-sm text-gray-500">-</span>
      ) : null}
    </div>
  );
}
