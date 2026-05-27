import type { PropsWithChildren } from 'react';

import { ConfirmationProvider } from '../../hooks/useConfirmation.hook';
import { BanneredLayout } from '../shared/layouts/BanneredLayout';
import { ArchivedSessionProvider } from '@/hooks/archive/ArchivedSessionProvider';

import { AppFooter } from './AppFooter';
import { AppHeader } from './Header';

export const PageLayout: React.FC<PropsWithChildren> = ({ children }) => {
  return (
    <ConfirmationProvider>
      <ArchivedSessionProvider>
        <BanneredLayout>
          <div className={`flex h-screen flex-col`}>
            <AppHeader />
            <main className="flex grow">
              <div className="grow">{children}</div>
            </main>
            <AppFooter />
          </div>
        </BanneredLayout>
      </ArchivedSessionProvider>
    </ConfirmationProvider>
  );
};
