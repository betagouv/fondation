import { colors } from '@codegouvfr/react-dsfr';
import Button from '@codegouvfr/react-dsfr/Button';
import { useEffect, useRef } from 'react';
import { useIntl } from 'react-intl';

import { SIDE_PANEL_ID, useSidePanel } from '../context/side-panel.context';
import { MissingEvaluationIcon } from '@/shared/components/missing-evaluation';
import type { SessionNominationFile } from '@queries/nomination-sessions.queries';

export function SidePanelTrigger(props: { nominationFile: SessionNominationFile }) {
  const { activeId, open } = useSidePanel();
  const intl = useIntl();
  const isActive = activeId === props.nominationFile.id;

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
  const auditionLabel = intl.formatMessage({ defaultMessage: 'Une audition est prévue pour ce magistrat' });

  return (
    <Button
      aria-controls={SIDE_PANEL_ID}
      aria-current={isActive ? 'true' : undefined}
      className="magistrat-panel-trigger flex! flex-col! items-start! text-left! font-normal! normal-case!"
      onClick={() => open(props.nominationFile.id)}
      priority="tertiary no outline"
      ref={ref}
      size="small"
      style={{ color: colors.decisions.text.default.grey.default }}
    >
      <div className="flex flex-wrap items-center text-left leading-4 underline">
        {props.nominationFile.content.nomMagistrat}
        {props.nominationFile.auditionDate && (
          <i
            aria-label={auditionLabel}
            className="fr-icon-speak-line fr-icon--sm fr-ml-1v cursor-pointer"
            title={auditionLabel}
          />
        )}
        <MissingEvaluationIcon
          className="fr-ml-1v cursor-pointer"
          missingEvaluation={props.nominationFile.missingEvaluation}
        />
        {hasAnnotations && (
          <i
            aria-label={annotationsLabel}
            className="ri-message-3-line fr-ml-1v relative -top-0.5 cursor-pointer before:size-4! before:content-['']"
            title={annotationsLabel}
          />
        )}
        {props.nominationFile.hasAttachment && (
          <i
            aria-label={attachmentLabel}
            className="ri-file-line fr-ml-1v relative -top-0.5 cursor-pointer before:size-4! before:content-['']"
            title={attachmentLabel}
          />
        )}
      </div>
      {props.nominationFile.content.posteActuel ? (
        <span className="text-xs">{props.nominationFile.content.posteActuel}</span>
      ) : null}
    </Button>
  );
}
