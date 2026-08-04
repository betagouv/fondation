import type { PropsWithChildren } from 'react';

import { BanneredLayout } from '@/shared/components/banners';
import { ArchivedSessionProvider } from '@/shared/context/archived-session';
import { ConfirmationProvider } from '@/shared/context/confirmation';
import { SessionValidationProvider } from '@/shared/context/session-validation';

import { AppFooter } from './AppFooter';
import { AppHeader } from './header/Header';

export function PageLayout({ children }: PropsWithChildren) {
  return (
    <ConfirmationProvider>
      <ArchivedSessionProvider>
        <SessionValidationProvider>
          <BanneredLayout>
            <div className={`flex min-h-screen flex-col`}>
              <AppHeader />
              <main className="flex grow flex-col">
                <div className="flex grow flex-col">{children}</div>
              </main>
              <AppFooter />
            </div>
          </BanneredLayout>
        </SessionValidationProvider>
      </ArchivedSessionProvider>
    </ConfirmationProvider>
  );
}
