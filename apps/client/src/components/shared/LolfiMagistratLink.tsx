import { ROUTE_PATHS } from '@/utils/route-path.utils';
import Button from '@codegouvfr/react-dsfr/Button';
import clsx from 'clsx';

export function LolfiMagistratLink(props: {
  className?: string;
  sessionId: string;
  nominationFileId: string;
  name?: string | null;
  small?: boolean;
}) {
  return (
    // oxlint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    <Button
      size={props.small ? 'small' : undefined}
      className={clsx('rounded-full', props.className)}
      priority="tertiary no outline"
      iconPosition="right"
      title="vers LOLFI"
      iconId="fr-icon-external-link-line"
      linkProps={{
        target: '_blank',
        to: {
          search: props.name ? '?' + new URLSearchParams({ name: props.name }).toString() : undefined,
          // prettier-ignore
          pathname: ROUTE_PATHS.REDIRECT_MAGISTRAT_LOLFI
            .replace(':sessionId', props.sessionId)
            .replace(':fileId', props.nominationFileId)
        }
      }}
    />
  );
}
