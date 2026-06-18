import type { PropsWithChildren } from 'react';

import { BanneredLayout } from '@/shared/components/banners/BanneredLayout';
import { ArchivedSessionProvider } from '@/shared/context/archived-session/ArchivedSessionProvider';
import { ConfirmationProvider } from '@/shared/context/confirmation/useConfirmation.hook';

import { AppFooter } from './AppFooter';
import { AppHeader } from './header/Header';

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
