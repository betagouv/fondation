import { useIntl, type MessageDescriptor } from 'react-intl';

export function DataTableCount(props: {
  className?: string;
  /** a plural message taking `count`, such as `{count, plural, one {session} other {sessions}}`; bare numbers without */
  label?: MessageDescriptor;
  loaded: number;
  total: number;
}) {
  const { formatMessage } = useIntl();
  const { loaded, total } = props;
  const label = props.label ? formatMessage(props.label, { count: total }) : undefined;

  return (
    <span className={props.className}>
      {label
        ? loaded < total
          ? formatMessage({ defaultMessage: '{loaded} {label} sur {total}' }, { label, loaded, total })
          : formatMessage({ defaultMessage: '{total} {label}' }, { label, total })
        : loaded < total
          ? formatMessage({ defaultMessage: '{loaded} sur {total}' }, { loaded, total })
          : total}
    </span>
  );
}
