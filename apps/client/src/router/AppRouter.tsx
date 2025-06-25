import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { HomePage } from '../HomePage';
import { TransparencesPage } from '../pages/TransparencesPage';
import { SecretariatGeneralPage } from '../pages/secretariat-general/SecretariatGeneralPage';
import { LoginPage } from '../pages/LoginPage';
import { NouvelleTransparencePage } from '../pages/secretariat-general/NouvelleTransparencePage';

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
        element: <TransparencesPage />
      },
      {
        path: 'secretariat-general',
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
