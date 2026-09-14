import type { ReactNode } from 'react';
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
        className="ri-message-3-line fr-icon--sm fr-ml-1v text-(--text-action-high-blue-france)"
        role="img"
      />
    </Tooltip>
  );
}

const NAME_UNDERLINE =
  'bg-[linear-gradient(currentColor,currentColor)] bg-size-[100%_1px] bg-position-[0_calc(100%-2px)] bg-no-repeat';

function ObservantName(props: {
  children: ReactNode;
  magistrat: { firstName: string; lastName: string; usedName: string | null } | null;
}) {
  if (!props.magistrat) return null;

  const words = fullNameUpperCase(props.magistrat).split(' ');
  const lastWord = words.pop();

  return (
    <>
      {words.length > 0 && <span className={NAME_UNDERLINE}>{`${words.join(' ')} `}</span>}
      <span className="whitespace-nowrap">
        <span className={NAME_UNDERLINE}>{lastWord}</span>
        <span className="inline-flex items-center align-middle">{props.children}</span>
      </span>
    </>
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
            <li className="fr-p-0" key={obs.id}>
              <Link
                className="bg-none! text-sm leading-6 whitespace-normal text-(--text-action-high-blue-france)"
                to={getObservationDetailsPath({
                  context: props.context ?? 'sg',
                  sessionId: props.sessionId,
                  nominationFileId: props.nominationFile.id,
                  observationId: obs.id,
                })}
              >
                <ObservantName magistrat={obs.magistrat}>
                  <ObservationAnnotationsIcon
                    hasDescription={obs.hasDescription}
                    hasUserComment={obs.hasUserComment}
                  />
                </ObservantName>
              </Link>
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
