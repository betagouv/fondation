import Header from '@codegouvfr/react-dsfr/Header';
import type { PropsWithChildren } from 'react';

import { AppFooter } from './AppFooter';
import { useHeaderBrand } from './header/useHeaderBrand';

/** a layout that reads no data, for pages that must render even when the rest of the application fails */
export function BareLayout({ children }: PropsWithChildren) {
  const brand = useHeaderBrand();

  return (
    <div className="flex min-h-screen flex-col">
      <Header {...brand} />
      <main className="flex grow flex-col">{children}</main>
      <AppFooter />
    </div>
  );
}
