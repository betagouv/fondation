import Button from '@codegouvfr/react-dsfr/Button';
import Tooltip from '@codegouvfr/react-dsfr/Tooltip';
import clsx from 'clsx';
import { useEffect, useId, useRef } from 'react';
import { useIntl } from 'react-intl';

import { SIDE_PANEL_ID, useSidePanel } from '../context/side-panel.context';
import { useAuditionExpectation } from '../hooks/use-audition-expectation/use-audition-expectation.hook';
import { GradeAndPosition } from '@/shared/components/GradeAndPosition';
import { MissingEvaluationIcon } from '@/shared/components/missing-evaluation';
import { isPastSchedule, type PlainTimeOnly } from '@/utils/time-only.util';
import type { SessionNominationFile } from '@queries/nomination-sessions.queries';

const END_OF_DAY: PlainTimeOnly = { hours: 23, minutes: 59, seconds: 59 };

export function SidePanelTrigger(props: { nominationFile: SessionNominationFile }) {
  const { activeId, open } = useSidePanel();
  const intl = useIntl();
  const isActive = activeId === props.nominationFile.id;

  const expectationId = useId();
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

  const attachmentLabel = intl.formatMessage({ defaultMessage: 'Au moins une pièce jointe est présente' });
  const { label: auditionExpectedLabel } = useAuditionExpectation(props.nominationFile);
  const auditionLabel = isPastSchedule(
    props.nominationFile.auditionDate,
    props.nominationFile.auditionTime ?? END_OF_DAY,
  )
    ? intl.formatMessage({ defaultMessage: 'Une audition a eu lieu pour ce magistrat' })
    : intl.formatMessage({ defaultMessage: 'Une audition est prévue pour ce magistrat' });

  const words = props.nominationFile.content.nomMagistrat.split(' ');
  const lastWord = words.pop();
  const leadingWords = words.join(' ');

  const nameUnderline = auditionExpectedLabel
    ? 'bg-[linear-gradient(currentColor,currentColor)] bg-size-[100%_1px] bg-position-[0_calc(100%-2px)] bg-no-repeat group-hover:bg-size-[100%_2px]'
    : undefined;

  const magistratLink = (
    <Button
      aria-controls={SIDE_PANEL_ID}
      aria-current={isActive ? 'true' : undefined}
      aria-describedby={auditionExpectedLabel ? expectationId : undefined}
      className={clsx(
        'group fr-px-0 text-left! font-normal! uppercase! hover:bg-transparent!',
        auditionExpectedLabel
          ? 'text-(--text-default-warning)! no-underline!'
          : 'text-(--text-action-high-blue-france)! underline! underline-offset-4 hover:decoration-2',
      )}
      onClick={() => open(props.nominationFile.id)}
      priority="tertiary no outline"
      ref={ref}
      size="small"
    >
      <span>
        {leadingWords && <span className={nameUnderline}>{`${leadingWords} `}</span>}
        <span className="whitespace-nowrap">
          <span className={nameUnderline}>
            {lastWord}
            {auditionExpectedLabel && (
              <i
                aria-hidden
                className="fr-icon-warning-fill fr-ml-1v relative -top-0.5 inline-block align-middle before:block before:size-3.5! before:content-['']"
              />
            )}
          </span>
          <span className="inline-flex items-center align-middle [&_span[id^=tooltip-owner]]:inline-flex">
            {props.nominationFile.auditionDate && (
              <Tooltip kind="hover" title={auditionLabel}>
                <i
                  aria-label={auditionLabel}
                  className="fr-icon-speak-line fr-icon--sm fr-ml-1v text-(--text-action-high-blue-france)"
                  role="img"
                />
              </Tooltip>
            )}
            {props.nominationFile.missingEvaluation && <MissingEvaluationIcon className="fr-ml-1v" />}
            {hasAnnotations && (
              <Tooltip kind="hover" title={annotationsLabel}>
                <i
                  aria-label={annotationsLabel}
                  className="ri-message-3-line fr-ml-1v relative -top-0.5 text-(--text-action-high-blue-france) before:size-4! before:content-['']"
                  role="img"
                />
              </Tooltip>
            )}
            {props.nominationFile.hasAttachment && (
              <Tooltip kind="hover" title={attachmentLabel}>
                <i
                  aria-label={attachmentLabel}
                  className="ri-file-line fr-ml-1v relative -top-0.5 text-(--text-action-high-blue-france) before:size-4! before:content-['']"
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
        {auditionExpectedLabel ? (
          <>
            <Tooltip title={auditionExpectedLabel}>{magistratLink}</Tooltip>
            <span className="fr-sr-only" id={expectationId}>
              {auditionExpectedLabel}
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
