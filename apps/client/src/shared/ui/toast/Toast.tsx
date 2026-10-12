import { Toast as BaseToast } from '@base-ui/react/toast';
import clsx from 'clsx';
import { useIntl } from 'react-intl';

const ICON_BOX = 'fr-icon--sm flex h-6 shrink-0 items-center';

const TONES = {
  error: {
    accent: 'border-l-(--border-plain-error)',
    icon: 'fr-icon-error-fill text-(--text-default-error)',
  },
  success: {
    accent: 'border-l-(--border-plain-success)',
    icon: 'fr-icon-success-fill text-(--text-default-success)',
  },
};

export function Toast(props: { toast: BaseToast.Root.ToastObject }) {
  const { formatMessage } = useIntl();
  const tone = props.toast.type === 'error' ? TONES.error : TONES.success;

  return (
    <BaseToast.Root
      className={clsx(
        'fr-p-3v pointer-events-auto flex items-start gap-2 border-0 border-l-4 border-solid',
        'bg-(--background-lifted-grey) text-(--text-default-grey) shadow-(--lifted-shadow)',
        'transition-[opacity,translate] duration-200 motion-reduce:transition-none',
        'data-ending-style:translate-x-2 data-ending-style:opacity-0',
        'data-starting-style:translate-x-2 data-starting-style:opacity-0',
        tone.accent,
      )}
      toast={props.toast}
    >
      <span aria-hidden className={clsx(ICON_BOX, tone.icon)} />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <BaseToast.Title className="fr-m-0 text-sm-plus leading-6 font-medium" />
        <BaseToast.Description className="fr-m-0 text-sm leading-6 text-(--text-mention-grey)" />
        <BaseToast.Action className="fr-btn fr-btn--sm fr-btn--tertiary-no-outline mt-1 min-h-0! self-start px-0! underline underline-offset-4 hover:bg-transparent! hover:decoration-2" />
      </div>
      <BaseToast.Close
        aria-hidden={undefined}
        aria-label={formatMessage({ defaultMessage: 'Fermer la notification' })}
        className={clsx(
          ICON_BOX,
          'fr-icon-close-line cursor-pointer text-(--text-mention-grey) hover:text-(--text-title-grey)',
        )}
      />
    </BaseToast.Root>
  );
}
