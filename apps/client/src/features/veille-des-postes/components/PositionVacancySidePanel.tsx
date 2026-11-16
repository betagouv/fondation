import Button from '@codegouvfr/react-dsfr/Button';
import { useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { useDateAndTime } from '@/shared/hooks/useDateAndTime';
import { SidePanel } from '@/shared/ui/side-panel';
import { Tooltip } from '@/shared/ui/tooltip';
import { formatDateOnly, type PlainDateOnly } from '@/utils/date-only.util';
import { useUser } from '@queries/auth.queries';
import {
  type HolderAlert,
  type HolderStatus,
  usePositionVacancyQuery,
} from '@queries/veille-des-postes.queries';

import { PositionStatusBadge } from './PositionStatusCell';
import { PositionVacancyForm } from './PositionVacancyForm';
import { WithdrawPositionVacancyButton } from './WithdrawPositionVacancyButton';

export const POSITION_VACANCY_SIDE_PANEL_ID = 'position-vacancy-side-panel';

export type EditedPosition = {
  alerts: HolderAlert[];
  installationDate: PlainDateOnly | null;
  /** the title tells the position and its court, as a sentence: "Présidente du tribunal judiciaire de Grasse" */
  magistrat: { id: string; name: string; title: string };
  status: HolderStatus;
};

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
      {props.edited && (
        <PositionVacancyContent edited={props.edited} onIncompleteChange={props.onLeaveBlockedChange} />
      )}
    </SidePanel>
  );
}

function PositionVacancyContent({
  edited,
  onIncompleteChange,
}: {
  edited: EditedPosition;
  onIncompleteChange: (incomplete: boolean) => void;
}) {
  const dateAndTime = useDateAndTime();
  const { user } = useUser();
  const { data } = usePositionVacancyQuery(edited.magistrat.id);
  const { formatMessage } = useIntl();
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
        who: !data.vacancy.updatedBy ? 'nobody' : data.vacancy.updatedBy.id === user?.id ? 'self' : 'someone',
      },
    );
  // read again after each change, when the row may have left a filtered table
  const status = data?.status ?? edited.status;
  const alerts = data?.alerts ?? edited.alerts;
  // the form keeps what was typed across the saves: a vacancy gone, withdrawn here or elsewhere, starts it over.
  // Read from the data, as the button that withdrew it may be gone before its own callback
  const [resets, setResets] = useState(0);
  const [hadVacancy, setHadVacancy] = useState(!!data?.vacancy);
  if (data && hadVacancy !== !!data.vacancy) {
    setHadVacancy(!!data.vacancy);
    if (hadVacancy) setResets((count) => count + 1);
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="-mx-8 -mt-8 flex flex-col gap-2 bg-(--background-alt-blue-france) px-8 py-6">
        <div className="flex flex-col gap-2">
          <h2 className="fr-h4 fr-mb-0 text-(--text-title-blue-france)" id="position-vacancy-title">
            {edited.magistrat.name}
          </h2>
          <p className="fr-mb-0">
            {edited.installationDate ? (
              <FormattedMessage
                defaultMessage="{title} depuis le {date}"
                values={{ date: formatDateOnly(edited.installationDate), title: edited.magistrat.title }}
              />
            ) : (
              edited.magistrat.title
            )}
          </p>
        </div>
      </div>

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <h3 className="fr-mb-0 text-lg font-semibold text-(--text-label-grey)">
            <FormattedMessage defaultMessage="Statut du poste" />
          </h3>
          {data?.vacancy && <WithdrawPositionVacancyButton magistratId={edited.magistrat.id} />}
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

      {data && (
        <PositionVacancyForm
          key={`${edited.magistrat.id} ${resets}`}
          magistratId={edited.magistrat.id}
          onIncompleteChange={onIncompleteChange}
          reasons={data.reasons}
          vacancy={data.vacancy}
        />
      )}
    </div>
  );
}
