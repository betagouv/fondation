import Button from '@codegouvfr/react-dsfr/Button';
import clsx from 'clsx';
import type { ReactNode } from 'react';

const ALERTING = 'text-sm-plus font-medium';
const RESOLVED = 'text-sm leading-6';

const TONES = {
  error: `bg-(--background-contrast-error) text-(--text-default-error) ${ALERTING}`,
  info: `bg-(--background-contrast-info) text-(--text-default-info) ${RESOLVED}`,
  neutral: `bg-(--background-contrast-grey) text-(--text-default-grey) ${RESOLVED}`,
  warning: `bg-(--background-contrast-warning) text-(--text-default-warning) ${ALERTING}`,
};

export function AlertBanner(props: {
  align?: 'center' | 'start';
  children?: ReactNode;
  className?: string;
  icon: string;
  message: ReactNode;
  tone: keyof typeof TONES;
}) {
  return (
    <div
      className={clsx(
        'flex min-h-6 gap-2',
        props.align === 'center' ? 'items-center' : 'items-start',
        TONES[props.tone],
        props.className,
      )}
    >
      <span aria-hidden className={clsx('fr-icon--sm shrink-0', props.icon)} />
      <span>{props.message}</span>
      {props.children}
    </div>
  );
}

export function AlertBannerAction(props: { children: ReactNode; onClick: () => void }) {
  return (
    <Button
      className="ml-auto min-h-0! px-3.5! py-0! whitespace-nowrap text-inherit! underline underline-offset-4 hover:bg-transparent! hover:decoration-2"
      onClick={props.onClick}
      priority="tertiary no outline"
      size="small"
    >
      {props.children}
    </Button>
  );
}
