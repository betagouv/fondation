import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import { type PropsWithChildren } from 'react';

type PageContentLayoutProps = PropsWithChildren & {
  fullBackgroundOrange?: boolean;
  fullBackgroundGreen?: boolean;
};

// FIXME: remove this component and behavior
export function PageContentLayout({
  fullBackgroundOrange = false,
  fullBackgroundGreen = false,
  children,
}: PageContentLayoutProps) {
  const backgroundClass = fullBackgroundOrange
    ? 'bg-(--background-alt-beige-gris-galet)'
    : fullBackgroundGreen
      ? 'bg-(--background-alt-green-emeraude)'
      : undefined;

  return (
    <div className={backgroundClass}>
      <div className={cx('fr-container', 'fr-pt-8v', 'fr-pb-6v')}>{children}</div>
    </div>
  );
}
