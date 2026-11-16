import Button from '@codegouvfr/react-dsfr/Button';
import Input from '@codegouvfr/react-dsfr/Input';
import Tag from '@codegouvfr/react-dsfr/Tag';
import clsx from 'clsx';
import { useEffect, useRef, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { useToasts } from '@/shared/ui/toast';
import { dateOnlyToIso } from '@/utils/date-only.util';
import {
  type PositionVacancy,
  useDeclarePositionVacancyMutation,
  type VacancyReason,
} from '@queries/veille-des-postes.queries';

import { AddPositionVacancyAttachmentsModal } from './AddPositionVacancyAttachmentsModal';
import { PositionVacancyAttachments } from './PositionVacancyAttachments';

/** as the API caps it */
const REASON_DETAIL_MAX_LENGTH = 300;

type Declaration = { reason: VacancyReason | null; reasonDetail: string; startDate: string };
type MissingField = 'date' | 'detail' | 'reason';

/** what the declaration lacks to be saved, in the order of the form: nothing while it is left empty */
function missingFieldOf(declaration: Declaration): MissingField | null {
  if (!declaration.reason) return declaration.startDate ? 'reason' : null;
  if (!declaration.startDate) return 'date';
  return declaration.reason === 'OTHER' && !declaration.reasonDetail.trim() ? 'detail' : null;
}

function isSameDeclaration(declaration: Declaration, saved: Declaration): boolean {
  return (
    declaration.reason === saved.reason &&
    declaration.startDate === saved.startDate &&
    (declaration.reason !== 'OTHER' || declaration.reasonDetail === saved.reasonDetail)
  );
}

function declarationOf(vacancy: PositionVacancy | null): Declaration {
  return {
    reason: vacancy?.reason.id ?? null,
    reasonDetail: vacancy?.reasonDetail ?? '',
    startDate: vacancy ? dateOnlyToIso(vacancy.startDate) : '',
  };
}

/**
 * every change is saved at once, as soon as the reason and the date are known: until then, it tells what is
 * missing. The saves go one after the other, each file once
 */
export function PositionVacancyForm(props: {
  magistratId: string;
  /** true while leaving would lose what is not saved */
  onIncompleteChange: (incomplete: boolean) => void;
  reasons: { id: VacancyReason; label: string }[];
  vacancy: PositionVacancy | null;
}) {
  const { formatMessage } = useIntl();
  const toasts = useToasts();
  const declare = useDeclarePositionVacancyMutation();
  const [declaration, setDeclaration] = useState(() => declarationOf(props.vacancy));
  // picked before the reason and the date, or on their way: each leaves the list once saved
  const [waitingFiles, setWaitingFiles] = useState<File[]>([]);
  const [shownMissingField, setShownMissingField] = useState<MissingField | null>(null);
  const [savedDetail, setSavedDetail] = useState<string | null>(null);
  const [hasFailed, setHasFailed] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  // a save reads the latest values, which a save queued behind another would miss in a closure
  const latest = useRef({ declaration, waitingFiles });
  const saved = useRef(declarationOf(props.vacancy));
  const sending = useRef<Promise<void> | null>(null);
  const isQueued = useRef(false);

  // leaving would lose what is not saved: a message naming what is missing, or files waiting for a vacancy
  const isIncomplete = shownMissingField !== null || waitingFiles.length > 0;
  const { onIncompleteChange } = props;
  useEffect(() => {
    onIncompleteChange(isIncomplete);
    return () => onIncompleteChange(false);
  }, [isIncomplete, onIncompleteChange]);

  const changeDeclaration = (next: Declaration) => {
    latest.current = { ...latest.current, declaration: next };
    setDeclaration(next);
  };
  const changeWaitingFiles = (next: File[]) => {
    latest.current = { ...latest.current, waitingFiles: next };
    setWaitingFiles(next);
  };

  const sendOnce = async () => {
    const { declaration: sent, waitingFiles: files } = latest.current;
    if (!sent.reason || missingFieldOf(sent)) return;
    if (isSameDeclaration(sent, saved.current) && files.length === 0) return;

    try {
      await declare.mutateAsync({ ...sent, files, magistratId: props.magistratId, reason: sent.reason });
      setHasFailed(false);
    } catch {
      isQueued.current = false;
      setHasFailed(true);
      toasts.error({ title: formatMessage({ defaultMessage: "Le statut n'a pas pu être enregistré" }) });
      return;
    }
    if (sent.reason === 'OTHER' && sent.reasonDetail !== saved.current.reasonDetail) {
      setSavedDetail(sent.reasonDetail);
    }
    saved.current = sent;
    changeWaitingFiles(latest.current.waitingFiles.filter((file) => !files.includes(file)));
  };

  /** a save asked while another runs waits for it, then sends what changed meanwhile */
  const send = (): Promise<void> => {
    if (sending.current) {
      isQueued.current = true;
      return sending.current;
    }
    sending.current = (async () => {
      do {
        isQueued.current = false;
        await sendOnce();
      } while (isQueued.current);
      sending.current = null;
    })();
    return sending.current;
  };

  /** tellsMissing: say what still prevents the save, once a reason is picked or a field left; not for a file */
  const save = (changes: Partial<Declaration>, options: { tellsMissing?: boolean } = {}): Promise<void> => {
    const next = { ...latest.current.declaration, ...changes };
    changeDeclaration(next);
    const missing = missingFieldOf(next);
    setShownMissingField((shown) => (options.tellsMissing || shown ? missing : null));
    return send();
  };

  const add = async (files: File[]) => {
    changeWaitingFiles([...latest.current.waitingFiles, ...files]);
    await send();
    setIsAdding(false);
  };
  const attachmentCount = (props.vacancy?.attachments.length ?? 0) + waitingFiles.length;
  const isComplete = !!declaration.reason && !missingFieldOf(declaration);

  return (
    <section className="flex flex-col gap-10 border-t border-(--border-default-grey) pt-8">
      <fieldset className="fr-m-0 fr-p-0 flex flex-col gap-4 border-0">
        <legend className="fr-mb-4v mx-0 px-0 pb-0 text-base font-semibold text-(--text-label-grey)">
          {props.vacancy ? (
            <FormattedMessage defaultMessage="Modifier le motif de la vacance" />
          ) : (
            <FormattedMessage defaultMessage="Ajouter un motif de vacance" />
          )}
        </legend>
        <ul className="fr-m-0 fr-p-0 flex list-none flex-wrap gap-2">
          {props.reasons.map(({ id, label }) => (
            <li className="fr-p-0" key={id}>
              <Tag
                nativeButtonProps={{
                  // the reason picked again is let go, until a vacancy is saved: the reset withdraws it then
                  onClick: () =>
                    save(
                      { reason: declaration.reason === id && !props.vacancy ? null : id },
                      { tellsMissing: true },
                    ),
                }}
                pressed={declaration.reason === id}
              >
                {label}
              </Tag>
            </li>
          ))}
        </ul>
        {shownMissingField === 'reason' && (
          <p className="fr-error-text fr-mt-0" role="alert">
            <FormattedMessage defaultMessage="Choisissez un motif pour enregistrer le statut" />
          </p>
        )}
        {declaration.reason === 'OTHER' && (
          <div>
            <Input
              className="fr-mb-0"
              label={<FormattedMessage defaultMessage="Précisez le motif" />}
              nativeInputProps={{
                maxLength: REASON_DETAIL_MAX_LENGTH,
                // saved once left, rather than at each letter
                onBlur: () => save({}, { tellsMissing: true }),
                onChange: (event) =>
                  changeDeclaration({ ...latest.current.declaration, reasonDetail: event.target.value }),
                value: declaration.reasonDetail,
              }}
              state={shownMissingField === 'detail' ? 'error' : 'default'}
              stateRelatedMessage={
                <FormattedMessage defaultMessage="Précisez le motif pour enregistrer le statut" />
              }
            />
            {savedDetail !== null && savedDetail === declaration.reasonDetail && (
              <p className="fr-valid-text fr-mt-2v" role="status">
                <FormattedMessage defaultMessage="Motif enregistré" />
              </p>
            )}
          </div>
        )}
      </fieldset>

      <Input
        // the DSFR gap between label and input is 8px: 16px, as under the other titles
        classes={{ label: 'mb-2 text-base font-semibold text-(--text-label-grey)' }}
        className="fr-mb-0 md:w-1/2"
        label={
          props.vacancy ? (
            <FormattedMessage defaultMessage="Modifier la date de la vacance" />
          ) : (
            <FormattedMessage defaultMessage="Date de la vacance" />
          )
        }
        nativeInputProps={{
          // typing the year goes through 0002, 0020 and 0202: saved once left
          onBlur: () => save({}, { tellsMissing: true }),
          onChange: (event) =>
            changeDeclaration({ ...latest.current.declaration, startDate: event.target.value }),
          type: 'date',
          value: declaration.startDate,
        }}
        state={shownMissingField === 'date' ? 'error' : 'default'}
        stateRelatedMessage={
          <FormattedMessage defaultMessage="Renseignez la date de la vacance pour enregistrer le statut" />
        }
      />

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <p
            className="fr-mb-0 text-base font-semibold text-(--text-label-grey)"
            id="position-vacancy-attachments-title"
          >
            <FormattedMessage
              defaultMessage="{count, plural, =0 {Justificatifs} one {Justificatif} other {Justificatifs ({count})}}"
              values={{ count: attachmentCount }}
            />
          </p>
          <Button onClick={() => setIsAdding(true)} priority="secondary" size="small">
            <FormattedMessage defaultMessage="Ajouter des justificatifs" />
          </Button>
        </div>
        {props.vacancy && props.vacancy.attachments.length > 0 && (
          <PositionVacancyAttachments
            attachments={props.vacancy.attachments}
            labelledBy="position-vacancy-attachments-title"
            magistratId={props.magistratId}
          />
        )}
        {waitingFiles.length > 0 && (
          <ul
            aria-labelledby="position-vacancy-attachments-title"
            // after the saved files, the line that separates them from these
            className={clsx(
              'fr-m-0 fr-p-0 list-none divide-y divide-(--border-default-grey)',
              !!props.vacancy?.attachments.length && 'border-t border-(--border-default-grey)',
            )}
          >
            {waitingFiles.map((file, index) => (
              <li className="fr-py-3v flex items-start justify-between gap-4" key={`${index} ${file.name}`}>
                <span className="flex min-w-0 flex-col">
                  <span className="flex items-center gap-2">
                    <span
                      aria-hidden="true"
                      className="fr-icon-file-line fr-icon--sm shrink-0 text-(--text-title-blue-france)"
                    />
                    <span className="truncate">{file.name}</span>
                  </span>
                  <span className="fr-mt-1v pl-6 text-xs text-(--text-mention-grey)">
                    {declare.isPending ? (
                      <FormattedMessage defaultMessage="Envoi en cours" />
                    ) : hasFailed && isComplete ? (
                      <FormattedMessage defaultMessage="L'envoi a échoué" />
                    ) : (
                      <FormattedMessage defaultMessage="Choisissez le motif et la date de la vacance pour l'enregistrer, ou retirez-le" />
                    )}
                  </span>
                </span>
                <Button
                  disabled={declare.isPending}
                  iconId="fr-icon-delete-bin-line"
                  onClick={() =>
                    changeWaitingFiles(latest.current.waitingFiles.filter((waiting) => waiting !== file))
                  }
                  priority="tertiary no outline"
                  size="small"
                  title={formatMessage({ defaultMessage: 'Retirer {name}' }, { name: file.name })}
                />
              </li>
            ))}
          </ul>
        )}
        {hasFailed && isComplete && waitingFiles.length > 0 && !declare.isPending && (
          <Button
            className="self-start"
            iconId="fr-icon-refresh-line"
            onClick={() => void send()}
            priority="tertiary no outline"
            size="small"
          >
            <FormattedMessage defaultMessage="Réessayer l'envoi" />
          </Button>
        )}
        {attachmentCount === 0 && (
          <p className="fr-mb-0 text-(--text-mention-grey)">
            <FormattedMessage defaultMessage="Aucun justificatif" />
          </p>
        )}
        <AddPositionVacancyAttachmentsModal
          isPending={declare.isPending}
          onAdd={(files) => void add(files)}
          onClose={() => setIsAdding(false)}
          open={isAdding}
        />
      </section>
    </section>
  );
}
