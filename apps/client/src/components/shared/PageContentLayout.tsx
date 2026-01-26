import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import { type FC, type PropsWithChildren } from 'react';

export type PageContentLayoutProps = PropsWithChildren & {
  fullBackgroundOrange?: boolean;
  fullBackgroundGreen?: boolean;
};

export const PageContentLayout: FC<PageContentLayoutProps> = ({
  fullBackgroundOrange = false,
  fullBackgroundGreen = false,
  children
}) => {
  const backgroundClass = fullBackgroundOrange
    ? 'bg-light-orange'
    : fullBackgroundGreen
      ? 'bg-light-green'
      : undefined;

  return (
    <div className={backgroundClass}>
      <div className={cx('fr-container', 'fr-py-5w')}>{children}</div>
    </div>
  );
};
