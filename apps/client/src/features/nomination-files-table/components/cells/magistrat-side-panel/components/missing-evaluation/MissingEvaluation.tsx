import Button from '@codegouvfr/react-dsfr/Button';
import Checkbox from '@codegouvfr/react-dsfr/Checkbox';
import { useIntl } from 'react-intl';

import { MissingEvaluationBanner } from '@/shared/components/missing-evaluation';
import { useUpdateNominationFileMissingEvaluationMutation } from '@queries/members.queries';
import type { SessionNominationFile } from '@queries/nomination-sessions.queries';

const SECTION_ID = 'magistrat-missing-evaluation-section';

/** DSFR hides the focus ring unless `:focus-visible` matches, which never happens when we focus the checkbox from the notice after a mouse click */
const ALWAYS_SHOW_FOCUS_RING = '[&_input:focus+label::before]:[outline-style:solid]';

function focusCheckbox() {
  const section = document.getElementById(SECTION_ID);
  section?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  section?.querySelector<HTMLInputElement>('input[type="checkbox"]')?.focus({ preventScroll: true });
}

export function MissingEvaluationNotice(props: { editable: boolean; missingEvaluation: boolean }) {
  const { formatMessage } = useIntl();

  return (
    <MissingEvaluationBanner className="-mx-8 -mt-10 px-8 py-4" missingEvaluation={props.missingEvaluation}>
      {props.editable && (
        <Button
          className="ml-auto whitespace-nowrap text-(--text-default-warning)! underline underline-offset-4 hover:bg-transparent! hover:decoration-2"
          onClick={focusCheckbox}
          priority="tertiary no outline"
          size="small"
        >
          {formatMessage({ defaultMessage: 'Modifier' })}
        </Button>
      )}
    </MissingEvaluationBanner>
  );
}

export function MissingEvaluation(props: { nominationFile: SessionNominationFile; sessionId: string }) {
  const { nominationFile, sessionId } = props;
  const { formatMessage } = useIntl();
  const { mutate, isError: saveFailed } = useUpdateNominationFileMissingEvaluationMutation();

  const editable = nominationFile.content.isUpdatable;
  if (!editable && !nominationFile.missingEvaluation) return null;

  return (
    <div className={ALWAYS_SHOW_FOCUS_RING} id={SECTION_ID}>
      <Checkbox
        options={[
          {
            label: formatMessage({ defaultMessage: 'Évaluation manquante' }),
            nativeInputProps: {
              checked: nominationFile.missingEvaluation,
              disabled: !editable,
              onChange: (event) =>
                mutate({
                  missingEvaluation: event.target.checked,
                  nominationFileId: nominationFile.id,
                  sessionId,
                }),
            },
          },
        ]}
      />
      {saveFailed && (
        <p className="fr-error-text fr-mt-0" role="alert">
          {formatMessage({ defaultMessage: "L'enregistrement a échoué" })}
        </p>
      )}
    </div>
  );
}
