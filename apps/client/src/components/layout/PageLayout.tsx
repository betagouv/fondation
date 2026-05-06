import type { PropsWithChildren } from 'react';

import { ConfirmationProvider } from '../../hooks/useConfirmation.hook';
import { BanneredLayout } from '../shared/layouts/BanneredLayout';

import { AppFooter } from './AppFooter';
import { AppHeader } from './Header';

export const PageLayout: React.FC<PropsWithChildren> = ({ children }) => {
  return (
    <ConfirmationProvider>
      <BanneredLayout>
        <div className={`flex h-screen flex-col`}>
          <AppHeader />
          <main className="flex flex-grow">
            <div className="flex-grow">{children}</div>
          </main>
          <AppFooter />
        </div>
      </BanneredLayout>
    </ConfirmationProvider>
  );
};
