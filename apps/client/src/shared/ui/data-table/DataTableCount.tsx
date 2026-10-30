import { useIntl } from 'react-intl';

export function DataTableCount(props: { loaded: number; total: number }) {
  const { formatMessage } = useIntl();
  const { loaded, total } = props;
  if (total === 0) return null;

  const count =
    loaded < total ? formatMessage({ defaultMessage: '{loaded} sur {total}' }, { loaded, total }) : total;
  return <span className="fr-ml-2v text-sm font-normal text-(--text-mention-grey)">({count})</span>;
}
