import { Link } from 'react-router-dom';
import { getObservationDetailsPath } from '../../utils/route-path.utils';

export type ObservationLinkItem = {
  id: string;
  firstName: string;
  lastName: string;
  observationId: string;
};

type ObservationLinksProps = {
  sessionId: string;
  nominationFileId: string;
  observations: ObservationLinkItem[];
  lodamObservants?: string[] | null;
  context?: 'sg' | 'membre';
};

export function ObservationLinks({
  sessionId,
  nominationFileId,
  observations,
  lodamObservants,
  context = 'sg'
}: ObservationLinksProps) {
  return (
    <div className="flex flex-col gap-1">
      {lodamObservants && lodamObservants.length > 0 && (
        <div className="text-sm">
          <span className="font-medium text-gray-600">LODAM: </span>
          <span>{lodamObservants.join(', ')}</span>
        </div>
      )}

      {observations.length > 0 && (
        <div className="text-sm">
          <span>
            {observations.map((obs, index) => (
              <span key={obs.observationId}>
                {index > 0 && ', '}
                <Link
                  to={getObservationDetailsPath(
                    { sessionId, nominationFileId, observationId: obs.observationId },
                    context
                  )}
                  className="text-blue-600"
                >
                  {obs.lastName} {obs.firstName}
                </Link>
              </span>
            ))}
          </span>
        </div>
      )}

      {(!lodamObservants || lodamObservants.length === 0) && observations.length === 0 && (
        <span className="text-sm text-gray-500">-</span>
      )}
    </div>
  );
}
