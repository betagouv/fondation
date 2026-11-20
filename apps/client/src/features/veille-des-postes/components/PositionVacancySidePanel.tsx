import Alert from '@codegouvfr/react-dsfr/Alert';
import Button from '@codegouvfr/react-dsfr/Button';
import { type ReactNode, useEffect, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { useDateAndTime } from '@/shared/hooks/useDateAndTime';
import { SidePanel } from '@/shared/ui/side-panel';
import { Tooltip } from '@/shared/ui/tooltip';
import { formatDateOnly, type PlainDateOnly } from '@/utils/date-only.util';
import { HttpException } from '@/utils/http-exception';
import { whoWrote } from '@/utils/user.utils';
import { useUser } from '@queries/auth.queries';
import {
  type CommentedPosition,
  type HolderAlert,
  type HolderStatus,
  usePositionCommentQuery,
  usePositionVacancyQuery,
} from '@queries/veille-des-postes.queries';

import { PositionCommentSection } from './PositionCommentSection';
import { PositionStatusBadge } from './PositionStatusCell';
import { PositionVacancyForm } from './PositionVacancyForm';
import { RetryableLoadFailure } from './RetryableLoadFailure';
import { WithdrawPositionVacancyButton } from './WithdrawPositionVacancyButton';

export const POSITION_VACANCY_SIDE_PANEL_ID = 'position-vacancy-side-panel';

export type EditedPosition = {
  alerts: HolderAlert[];
  commented: CommentedPosition;
  /** the id of its row in the table */
  id: string;
  installationDate: PlainDateOnly | null;
  status: HolderStatus;
} & (
  | {
      courtLabel: string | null;
      /** the title tells the position and its court in a sentence: "Présidente du tribunal judiciaire de Grasse" */
      magistrat: { id: string; name: string; title: string };
    }
  | { courtLabel: string; magistrat: null }
);

export function PositionVacancySidePanel(props: {
  edited: EditedPosition | null;
  /** the form tells what it lacks to be saved: the panel neither closes nor moves */
  isLeaveBlocked: boolean;
  onClose: () => void;
  onLeaveBlockedChange: (blocked: boolean) => void;
  /** undefined on the last row loaded */
  onNext: (() => void) | undefined;
  /** undefined on the first row */
  onPrevious: (() => void) | undefined;
}) {
  return (
    <SidePanel
      ariaLabelledBy="position-vacancy-title"
      disableClose={props.isLeaveBlocked}
      header={
        <>
          <Button
            disabled={props.isLeaveBlocked || !props.onPrevious}
            iconId="fr-icon-arrow-left-s-line"
            iconPosition="left"
            onClick={props.onPrevious}
            priority="tertiary no outline"
            size="small"
          >
            <FormattedMessage defaultMessage="Précédent" />
          </Button>
          <Button
            disabled={props.isLeaveBlocked || !props.onNext}
            iconId="fr-icon-arrow-right-s-line"
            iconPosition="right"
            onClick={props.onNext}
            priority="tertiary no outline"
            size="small"
          >
            <FormattedMessage defaultMessage="Suivant" />
          </Button>
        </>
      }
      id={POSITION_VACANCY_SIDE_PANEL_ID}
      onClose={props.onClose}
      open={!!props.edited}
    >
      {props.edited &&
        (props.edited.magistrat ? (
          <PositionVacancyContent
            edited={props.edited}
            magistrat={props.edited.magistrat}
            onLeaveBlockedChange={props.onLeaveBlockedChange}
          />
        ) : (
          <VacantCourtContent
            courtLabel={props.edited.courtLabel}
            edited={props.edited}
            onLeaveBlockedChange={props.onLeaveBlockedChange}
          />
        ))}
    </SidePanel>
  );
}

function VacantCourtContent({
  courtLabel,
  edited,
  onLeaveBlockedChange,
}: {
  courtLabel: string;
  edited: EditedPosition;
  onLeaveBlockedChange: (isLeaveBlocked: boolean) => void;
}) {
  const { error } = usePositionCommentQuery(edited.commented);
  // the court left the veille since the table loaded
  const isGone = error instanceof HttpException && error.statusCode === 404;

  return (
    <div className="flex flex-col gap-8">
      <PositionHeading name={courtLabel} />
      <section className="flex flex-col gap-4">
        <h3 className="fr-mb-0 text-lg font-semibold text-(--text-label-grey)">
          <FormattedMessage defaultMessage="Statut du poste" />
        </h3>
        <div className="flex flex-col items-start gap-2">
          <PositionStatusBadge status={edited.status} />
        </div>
      </section>
      {isGone && (
        <Alert
          description={<FormattedMessage defaultMessage="Rechargez la page pour mettre le tableau à jour" />}
          severity="info"
          small
          title={<FormattedMessage defaultMessage="Cette juridiction n'est plus suivie" />}
        />
      )}
      <PositionCommentSection
        key={edited.id}
        onDirtyChange={onLeaveBlockedChange}
        position={edited.commented}
      />
    </div>
  );
}

function PositionHeading(props: { name: string; title?: ReactNode }) {
  return (
    <div className="-mx-8 -mt-8 flex flex-col gap-2 bg-(--background-alt-blue-france) px-8 py-6">
      <div className="flex flex-col gap-2">
        <h2 className="fr-h4 fr-mb-0 text-(--text-title-blue-france)" id="position-vacancy-title">
          {props.name}
        </h2>
        {props.title && <p className="fr-mb-0">{props.title}</p>}
      </div>
    </div>
  );
}

function PositionVacancyContent({
  edited,
  magistrat,
  onLeaveBlockedChange,
}: {
  edited: EditedPosition;
  magistrat: NonNullable<EditedPosition['magistrat']>;
  onLeaveBlockedChange: (isLeaveBlocked: boolean) => void;
}) {
  const { formatMessage } = useIntl();
  const dateAndTime = useDateAndTime();
  const { user } = useUser();
  const { data, error, isFetching, refetch } = usePositionVacancyQuery(magistrat.id);

  const [isFormIncomplete, setFormIncomplete] = useState(false);
  const [isCommentDirty, setCommentDirty] = useState(false);
  const isLeaveBlocked = isFormIncomplete || isCommentDirty;

  useEffect(() => {
    onLeaveBlockedChange(isLeaveBlocked);

    return () => onLeaveBlockedChange(false);
  }, [isLeaveBlocked, onLeaveBlockedChange]);

  // the form keeps what was typed across the saves: a vacancy gone (withdrawn here or elsewhere) starts it
  // over. Read from the data: the button that withdrew it may be gone before its own callback
  const [resets, setResets] = useState(0);
  const [hadVacancy, setHadVacancy] = useState(!!data?.vacancy);

  if (data && hadVacancy !== !!data.vacancy) {
    setHadVacancy(!!data.vacancy);
    if (hadVacancy) setResets((count) => count + 1);
  }

  // read again after each change: the row may have left a filtered table
  const status = data?.status ?? edited.status;
  const alerts = data?.alerts ?? edited.alerts;

  const definedBy =
    data?.vacancy &&
    formatMessage(
      {
        defaultMessage:
          'Ce statut a été défini le {date} à {time}{who, select, self { par vous} someone { par {author}} other {}}',
      },
      {
        author: data.vacancy.updatedBy?.name,
        ...dateAndTime(data.vacancy.updatedAt),
        who: whoWrote({ currentUserId: user?.id, writer: data.vacancy.updatedBy }),
      },
    );

  return (
    <div className="flex flex-col gap-8">
      <PositionHeading
        name={magistrat.name}
        title={
          edited.installationDate ? (
            <FormattedMessage
              defaultMessage="{title} depuis le {date}"
              values={{ date: formatDateOnly(edited.installationDate), title: magistrat.title }}
            />
          ) : (
            magistrat.title
          )
        }
      />

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <h3 className="fr-mb-0 text-lg font-semibold text-(--text-label-grey)">
            <FormattedMessage defaultMessage="Statut du poste" />
          </h3>
          {data?.vacancy && <WithdrawPositionVacancyButton magistratId={magistrat.id} />}
        </div>
        <div className="flex flex-col items-start gap-2">
          <div className="flex items-center gap-2">
            <PositionStatusBadge status={status} />
            {definedBy && (
              <Tooltip focusable label={definedBy}>
                <i
                  aria-label={definedBy}
                  className="fr-icon-question-line fr-icon--sm text-(--text-action-high-blue-france)"
                  role="img"
                />
              </Tooltip>
            )}
          </div>
          {status.detail && <span className="text-sm">{status.detail}</span>}
        </div>
        {status.hint && <p className="fr-mb-0 text-sm">{status.hint}</p>}
        {alerts.map((alert) => (
          <span className="text-sm text-(--text-mention-grey)" key={alert.id}>
            {alert.shortLabel}
          </span>
        ))}
      </section>

      {!data && error && (
        <PositionVacancyLoadFailure error={error} isRetrying={isFetching} onRetry={() => void refetch()} />
      )}
      {data && (
        <PositionVacancyForm
          key={`${magistrat.id} ${resets}`}
          magistratId={magistrat.id}
          onIncompleteChange={setFormIncomplete}
          rules={data}
          vacancy={data.vacancy}
        />
      )}
      <PositionCommentSection key={edited.id} onDirtyChange={setCommentDirty} position={edited.commented} />
    </div>
  );
}

/** a 404: LOLFI moved the magistrat since the table loaded or their position left the veille */
function PositionVacancyLoadFailure(props: { error: Error; isRetrying: boolean; onRetry: () => void }) {
  if (props.error instanceof HttpException && props.error.statusCode === 404) {
    return (
      <Alert
        description={<FormattedMessage defaultMessage="Rechargez la page pour mettre le tableau à jour" />}
        severity="info"
        small
        title={<FormattedMessage defaultMessage="Ce magistrat n'occupe plus ce poste" />}
      />
    );
  }
  return (
    <RetryableLoadFailure
      isRetrying={props.isRetrying}
      onRetry={props.onRetry}
      title={<FormattedMessage defaultMessage="Le statut n'a pas pu être chargé" />}
    />
  );
}
