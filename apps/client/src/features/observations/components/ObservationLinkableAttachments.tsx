import Tag from '@codegouvfr/react-dsfr/Tag';
import { useIntl } from 'react-intl';

export type LinkableAttachment = { observationId: string; fileId: string; name: string };

const isSameAttachment = (a: LinkableAttachment, b: LinkableAttachment) =>
  a.observationId === b.observationId && a.fileId === b.fileId;

export function ObservationLinkableAttachments(props: {
  attachments: readonly LinkableAttachment[];
  linked: readonly LinkableAttachment[];
  onToggle: (attachments: LinkableAttachment[]) => void;
}) {
  const intl = useIntl();
  const { attachments, linked, onToggle } = props;

  const toggle = (attachment: LinkableAttachment) =>
    onToggle(
      linked.some((candidate) => isSameAttachment(candidate, attachment))
        ? linked.filter((candidate) => !isSameAttachment(candidate, attachment))
        : [...linked, attachment],
    );

  return (
    <ul className="fr-m-0 fr-p-0 flex list-none flex-row flex-wrap gap-x-2">
      {attachments.map((attachment) => (
        <li key={`${attachment.observationId}_${attachment.fileId}`}>
          <Tag
            iconId="fr-icon-file-fill"
            nativeButtonProps={{ onClick: () => toggle(attachment) }}
            pressed={linked.some((candidate) => isSameAttachment(candidate, attachment))}
            small
            title={intl.formatMessage({ defaultMessage: 'Lier "{name}"' }, { name: attachment.name })}
          >
            {attachment.name}
          </Tag>
        </li>
      ))}
    </ul>
  );
}
