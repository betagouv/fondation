import type { PropsWithChildren } from 'react';

import { RemarkButton } from '@/features/remarks/components/RemarkButton';
import { SurveyInvitation } from '@/features/survey/components/SurveyInvitation';
import { BanneredLayout } from '@/shared/components/banners';
import { ArchivedSessionProvider } from '@/shared/context/archived-session';
import { ConfirmModalProvider } from '@/shared/context/confirm-modal';
import { FloatingActionsProvider, FloatingActionsStack } from '@/shared/context/floating-actions';
import { ToastProvider } from '@/shared/ui/toast';

import { AppFooter } from './AppFooter';
import { AppHeader } from './header/Header';

export function PageLayout({ children }: PropsWithChildren) {
  return (
    <ToastProvider>
      <ConfirmModalProvider>
        <SurveyInvitation />
        <ArchivedSessionProvider>
          <BanneredLayout>
            <FloatingActionsProvider>
              <div className={`flex min-h-screen flex-col`}>
                <AppHeader />
                <main className="flex grow flex-col">
                  <div className="flex grow flex-col">{children}</div>
                </main>
                <FloatingActionsStack />
                <AppFooter />
              </div>
              <RemarkButton />
            </FloatingActionsProvider>
          </BanneredLayout>
        </ArchivedSessionProvider>
      </ConfirmModalProvider>
    </ToastProvider>
  );
}
