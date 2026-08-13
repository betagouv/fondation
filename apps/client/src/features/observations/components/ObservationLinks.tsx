import { FormattedMessage, useIntl } from 'react-intl';
import { Link } from 'react-router';

import { Tooltip } from '@/shared/ui/tooltip';
import { getObservationDetailsPath } from '@/utils/route-path.utils';
import { fullNameUpperCase } from '@/utils/user.utils';

function ObservationAnnotationsIcon(props: { hasDescription: boolean; hasUserComment: boolean }) {
  const intl = useIntl();
  if (!props.hasDescription && !props.hasUserComment) return null;

  const annotations: string[] = [];
  if (props.hasDescription)
    annotations.push(intl.formatMessage({ defaultMessage: "un texte de l'observant" }));
  if (props.hasUserComment) annotations.push(intl.formatMessage({ defaultMessage: 'votre commentaire' }));

  const label = intl.formatMessage(
    { defaultMessage: 'Cette observation contient {annotations}' },
    { annotations: intl.formatList(annotations, { type: 'conjunction' }) },
  );

  return (
    <Tooltip label={label}>
      <i
        aria-label={label}
        className="ri-message-3-line fr-ml-1v relative -top-1 inline-block align-middle text-(--text-action-high-blue-france) before:size-4! before:content-['']"
        role="img"
      />
    </Tooltip>
  );
}

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
      magistrat: { id: string; firstName: string; lastName: string; usedName: string | null } | null;
    }[];
  };
}) {
  return (
    <div className="flex flex-col gap-1">
      {props.nominationFile.legacyObservers.length > 0 && (
        <div className="text-sm">
          <span className="font-medium text-(--text-mention-grey)">
            <FormattedMessage defaultMessage="LODAM :" />{' '}
          </span>
          <span>{props.nominationFile.legacyObservers.join(', ')}</span>
        </div>
      )}

      {props.nominationFile.observations.length > 0 && (
        <ul className="fr-m-0 fr-p-0 flex list-none flex-col gap-y-1 text-sm">
          {props.nominationFile.observations.map((obs) => (
            <li className="fr-p-0 whitespace-nowrap" key={obs.id}>
              <Link
                className="whitespace-normal text-(--text-action-high-blue-france)"
                to={getObservationDetailsPath({
                  context: props.context ?? 'sg',
                  sessionId: props.sessionId,
                  nominationFileId: props.nominationFile.id,
                  observationId: obs.id,
                })}
              >
                {obs.magistrat ? fullNameUpperCase(obs.magistrat) : null}
              </Link>
              <ObservationAnnotationsIcon
                hasDescription={obs.hasDescription}
                hasUserComment={obs.hasUserComment}
              />
            </li>
          ))}
        </ul>
      )}

      {!props.nominationFile.legacyObservers?.length && !props.nominationFile.observations?.length ? (
        <span className="text-sm text-(--text-mention-grey)">-</span>
      ) : null}
    </div>
  );
}
