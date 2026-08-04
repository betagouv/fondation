import Badge from '@codegouvfr/react-dsfr/Badge';
import Button from '@codegouvfr/react-dsfr/Button';
import type { ReactNode } from 'react';
import { FormattedMessage } from 'react-intl';

import { useArchivedSession } from '@/shared/context/archived-session';
import { PopoverContent, PopoverRoot, PopoverTrigger } from '@/shared/ui/popover';
import type { DetailedNominationSessionDto } from '@api/types';
import { useFindSessionDocsQuery } from '@queries/agenda.queries';
import { useListNominationSessionAttachmentsQuery } from '@queries/nomination-sessions.queries';

import { DocGenerationMenu } from './DocGenerationMenu';
import * as importAttachments from './ImportAttachmentModal';
import { NominationSessionAttachmentList } from './NominationSessionAttachmentList';
import { NominationSessionDocsList } from './NominationSessionDocsList';
import { TransparenceActionsMenu } from './TransparenceActionsMenu';

export function CountedPopover(props: { children: ReactNode; count: number; label: ReactNode }) {
  return (
    <PopoverRoot>
      <PopoverTrigger priority="tertiary no outline" size="small">
        {props.label}
        <Badge as="span" className="fr-ml-2v" noIcon small>
          {props.count}
        </Badge>
        <i aria-hidden className="fr-icon-arrow-down-s-line fr-icon--sm fr-ml-1v" />
      </PopoverTrigger>

      <PopoverContent className="max-h-96 w-96 overflow-y-auto">{props.children}</PopoverContent>
    </PopoverRoot>
  );
}

export function EmptyPanel(props: { children: ReactNode }) {
  return <p className="fr-m-0 text-sm text-(--text-mention-grey)">{props.children}</p>;
}

export function TransparenceToolbar(props: { transparence: DetailedNominationSessionDto }) {
  const { transparence } = props;
  const { isArchived } = useArchivedSession();
  const { data: attachments } = useListNominationSessionAttachmentsQuery({ sessionId: transparence.id });
  const { data: docs } = useFindSessionDocsQuery({ sessionId: transparence.id });

  const attachmentsCount = attachments?.items.length ?? 0;
  const docsCount = docs?.items.length ?? 0;

  return (
    <div className="fr-py-2v fr-my-4v mx-[calc(50%-50vw)] bg-(--background-contrast-grey) px-[calc(50vw-50%)]">
      <div className="flex items-center justify-between gap-4">
        <ul className="fr-m-0 fr-p-0 flex list-none items-center gap-4">
          <li className="fr-p-0">
            <CountedPopover count={docsCount} label={<FormattedMessage defaultMessage="Documents" />}>
              {docsCount ? (
                <NominationSessionDocsList sessionId={transparence.id} />
              ) : (
                <EmptyPanel>
                  <FormattedMessage defaultMessage="Aucun document généré." />
                </EmptyPanel>
              )}
            </CountedPopover>
          </li>

          <li className="fr-p-0">
            <CountedPopover
              count={attachmentsCount}
              label={<FormattedMessage defaultMessage="Pièces jointes" />}
            >
              {attachmentsCount ? (
                <NominationSessionAttachmentList sessionId={transparence.id} placeholder={null} />
              ) : (
                <EmptyPanel>
                  <FormattedMessage defaultMessage="Aucune pièce jointe." />
                </EmptyPanel>
              )}

              {!isArchived && (
                <Button
                  className="fr-mt-2v self-center"
                  iconId="fr-icon-add-line"
                  nativeButtonProps={importAttachments.modal.buttonProps}
                  priority="tertiary no outline"
                  size="small"
                >
                  <FormattedMessage defaultMessage="Ajouter" />
                </Button>
              )}
            </CountedPopover>
          </li>
        </ul>

        <div className="flex items-center gap-2">
          {!isArchived && <DocGenerationMenu sessionId={transparence.id} />}
          <TransparenceActionsMenu transparence={transparence} />
        </div>
      </div>
    </div>
  );
}
