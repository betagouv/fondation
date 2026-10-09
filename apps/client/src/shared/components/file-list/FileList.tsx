import Button from '@codegouvfr/react-dsfr/Button';
import { createContext, useContext, type ReactNode } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { useDateAndTime } from '@/shared/hooks/useDateAndTime';
import { formatFileSize, splitFileName } from '@/utils/file.utils';
import { useUser } from '@queries/auth.queries';

const CurrentUserIdContext = createContext<string | undefined>(undefined);

export function FileList(props: { 'aria-labelledby'?: string; children: ReactNode }) {
  const { user } = useUser();

  return (
    <CurrentUserIdContext value={user?.id}>
      <ul
        aria-labelledby={props['aria-labelledby']}
        className="fr-m-0 fr-p-0 list-none divide-y divide-(--border-default-grey) border-y border-(--border-default-grey)"
      >
        {props.children}
      </ul>
    </CurrentUserIdContext>
  );
}

export function FileListItem(props: {
  addedAt: string;
  addedBy: { id: string; name: string } | null;
  children?: ReactNode;
  disabled?: boolean;
  header?: ReactNode;
  name: string;
  onDelete?: () => void;
  onDownload: () => void;
  onOpen: () => void;
  size?: number | null;
}) {
  const { formatMessage } = useIntl();
  const currentUserId = useContext(CurrentUserIdContext);
  const dateAndTime = useDateAndTime();

  const { extension, label } = splitFileName(props.name);
  const format = extension?.toUpperCase();

  return (
    <li className="fr-py-3v">
      {props.header && <div className="fr-mb-2v flex items-center gap-2">{props.header}</div>}

      <div className="flex items-start justify-between gap-4">
        <div className="grid min-w-0 items-center gap-x-2" style={{ gridTemplateColumns: 'auto 1fr' }}>
          <span
            aria-hidden="true"
            className="fr-icon-file-line fr-icon--sm shrink-0 text-(--text-title-blue-france)"
            style={{ transform: 'translateY(1px)' }}
          />
          <button
            className="-mx-1 -my-0.5 truncate border-0 bg-transparent px-1 py-0.5 text-left text-(--text-action-high-blue-france) underline underline-offset-2 hover:bg-(--background-default-grey-hover) disabled:opacity-50"
            disabled={props.disabled}
            onClick={props.onOpen}
            title={formatMessage(
              { defaultMessage: 'Ouvrir {name} dans un nouvel onglet' },
              { name: props.name },
            )}
            type="button"
          >
            {label}
          </button>
          <span className="fr-mt-1v col-start-2 flex flex-wrap gap-x-2 text-xs text-(--text-mention-grey)">
            {format && (
              <span>
                <FormattedMessage defaultMessage="Format : {format}" values={{ format }} />
              </span>
            )}
            {props.size != null && (
              <span>
                <FormattedMessage
                  defaultMessage="Taille : {size}"
                  values={{ size: formatFileSize(props.size) }}
                />
              </span>
            )}
            <span>
              <FormattedMessage
                defaultMessage="Ajoutée : le {date} à {time}{who, select, self { par vous} someone { par {author}} other {}}"
                values={{
                  author: props.addedBy?.name,
                  ...dateAndTime(props.addedAt),
                  who: !props.addedBy ? 'nobody' : props.addedBy.id === currentUserId ? 'self' : 'someone',
                }}
              />
            </span>
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <Button
            disabled={props.disabled}
            iconId="fr-icon-download-line"
            onClick={props.onDownload}
            priority="tertiary no outline"
            size="small"
            title={formatMessage({ defaultMessage: 'Télécharger {name}' }, { name: props.name })}
          />
          {props.onDelete && (
            <Button
              disabled={props.disabled}
              iconId="fr-icon-delete-bin-line"
              onClick={props.onDelete}
              priority="tertiary no outline"
              size="small"
              title={formatMessage({ defaultMessage: 'Supprimer {name}' }, { name: props.name })}
            />
          )}
        </div>
      </div>

      {props.children}
    </li>
  );
}
