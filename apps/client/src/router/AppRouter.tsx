import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { HomePage } from '../HomePage';
import { TransparencesPage } from '../pages/TransparencesPage';
import { SecretariatGeneralPage } from '../pages/secretariat-general/SecretariatGeneralPage';
import { LoginPage } from '../pages/LoginPage';
import { NouvelleTransparencePage } from '../pages/secretariat-general/NouvelleTransparencePage';
import { AuthGuard } from '../components/guards/AuthGuard';
import { Outlet } from 'react-router-dom';

// Layout pour les routes protégées du secretariat général
const SecretariatGeneralLayout = () => (
  <AuthGuard>
    <Outlet />
  </AuthGuard>
);

const router = createBrowserRouter([
  {
    path: '/',
    element: <HomePage />,
    children: [
      {
        path: 'login',
        element: <LoginPage />
      },
      {
        path: 'transparences',
        element: (
          <AuthGuard>
            <TransparencesPage />
          </AuthGuard>
        )
      },
      {
        path: 'secretariat-general',
        element: <SecretariatGeneralLayout />,
        children: [
          {
            index: true,
            element: <SecretariatGeneralPage />
          },
          {
            path: 'nouvelle-transparence',
            element: <NouvelleTransparencePage />
          }
        ]
      }
    ]
  }
]);

export const AppRouter = () => {
  return <RouterProvider router={router} />;
};
