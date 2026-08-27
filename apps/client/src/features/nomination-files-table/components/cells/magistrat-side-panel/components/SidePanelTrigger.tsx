import Button from '@codegouvfr/react-dsfr/Button';
import clsx from 'clsx';
import { useEffect, useId, useRef } from 'react';
import { useIntl } from 'react-intl';

import { SIDE_PANEL_ID, useSidePanel } from '../context/side-panel.context';
import { useAuditionExpectation } from '../hooks/use-audition-expectation/use-audition-expectation.hook';
import { GradeAndPosition } from '@/shared/components/GradeAndPosition';
import { Tooltip } from '@/shared/ui/tooltip';
import { isPastSchedule, type PlainTimeOnly } from '@/utils/time-only.util';
import type { SessionNominationFile } from '@queries/nomination-sessions.queries';

const END_OF_DAY: PlainTimeOnly = { hours: 23, minutes: 59, seconds: 59 };

export function SidePanelTrigger(props: { nominationFile: SessionNominationFile }) {
  const { activeId, open } = useSidePanel();
  const intl = useIntl();
  const isActive = activeId === props.nominationFile.id;

  const warningId = useId();
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (isActive) ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [isActive]);

  const annotations: string[] = [];
  if (props.nominationFile.memo) annotations.push(intl.formatMessage({ defaultMessage: 'mémo' }));
  if (props.nominationFile.summary?.canWrite || props.nominationFile.summary?.canRead)
    annotations.push(intl.formatMessage({ defaultMessage: 'synthèse' }));
  if ((props.nominationFile.comment?.trim().length ?? 0) > 0)
    annotations.push(intl.formatMessage({ defaultMessage: 'commentaire' }));

  const hasAnnotations = annotations.length > 0;
  const annotationsLabel = intl.formatMessage(
    { defaultMessage: 'Ce dossier a des annotations ({annotations})' },
    { annotations: intl.formatList(annotations, { type: 'conjunction' }) },
  );

  const { labels: auditionExpectations } = useAuditionExpectation(props.nominationFile);
  const warnings = [...auditionExpectations];
  if (props.nominationFile.missingEvaluation)
    warnings.push(
      intl.formatMessage({ defaultMessage: 'Évaluation manquante dans le dossier administratif LOLFI' }),
    );
  const warningLabel = warnings.length > 0 ? warnings.join('. ') : null;
  const warningTooltip =
    warnings.length > 1 ? (
      <ul className="fr-m-0 fr-p-0 list-none">
        {warnings.map((warning) => (
          <li key={warning}>{`- ${warning}`}</li>
        ))}
      </ul>
    ) : (
      warningLabel
    );

  const auditionLabel = isPastSchedule(
    props.nominationFile.auditionDate,
    props.nominationFile.auditionTime ?? END_OF_DAY,
  )
    ? intl.formatMessage({ defaultMessage: 'Une audition a eu lieu pour ce magistrat' })
    : intl.formatMessage({ defaultMessage: 'Une audition est prévue pour ce magistrat' });

  const words = props.nominationFile.content.nomMagistrat.split(' ');
  const lastWord = words.pop();
  const leadingWords = words.join(' ');

  const nameUnderline = warningLabel
    ? 'bg-[linear-gradient(currentColor,currentColor)] bg-size-[100%_1px] bg-position-[0_calc(100%-2px)] bg-no-repeat group-hover:bg-size-[100%_2px]'
    : undefined;

  const magistratLink = (
    <Button
      aria-controls={SIDE_PANEL_ID}
      aria-current={isActive ? 'true' : undefined}
      aria-describedby={warningLabel ? warningId : undefined}
      className={clsx(
        'group fr-px-0 text-left! font-normal! hover:bg-transparent!',
        warningLabel
          ? 'text-(--text-default-warning)! no-underline!'
          : 'text-(--text-action-high-blue-france)! underline! underline-offset-4 hover:decoration-2',
      )}
      onClick={() => open(props.nominationFile.id)}
      priority="tertiary no outline"
      ref={ref}
      size="small"
    >
      <span>
        {(warningLabel || leadingWords) && (
          <span className={clsx('uppercase!', nameUnderline)}>
            {warningLabel && (
              <i
                aria-hidden
                className="fr-icon-error-warning-line fr-mr-1v relative -top-0.5 inline-block align-middle before:block before:size-3.5! before:content-['']"
              />
            )}
            {leadingWords && `${leadingWords} `}
          </span>
        )}
        <span className="whitespace-nowrap">
          <span className={clsx('uppercase!', nameUnderline)}>{lastWord}</span>
          <span className="inline-flex items-center align-middle">
            {props.nominationFile.auditionDate && (
              <Tooltip label={auditionLabel}>
                <i
                  aria-label={auditionLabel}
                  className="fr-icon-speak-line fr-icon--sm fr-ml-1v text-(--text-action-high-blue-france)"
                  role="img"
                />
              </Tooltip>
            )}
            {hasAnnotations && (
              <Tooltip label={annotationsLabel}>
                <i
                  aria-label={annotationsLabel}
                  className="ri-message-3-line fr-icon--sm fr-ml-1v text-(--text-action-high-blue-france)"
                  role="img"
                />
              </Tooltip>
            )}
          </span>
        </span>
      </span>
    </Button>
  );

  return (
    <div className="flex flex-col items-start gap-y-0.5">
      <div className="text-left leading-4">
        {warningLabel ? (
          <>
            <Tooltip label={warningTooltip}>{magistratLink}</Tooltip>
            <span className="fr-sr-only" id={warningId}>
              {warningLabel}
            </span>
          </>
        ) : (
          magistratLink
        )}
      </div>
      {props.nominationFile.content.posteActuel ? (
        <span className="text-xs leading-5">
          <GradeAndPosition
            grade={props.nominationFile.content.grade}
            position={props.nominationFile.content.posteActuel}
          />
        </span>
      ) : null}
    </div>
  );
}
