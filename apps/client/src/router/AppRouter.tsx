import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { HomePage } from "../HomePage";
import { TransparencesPage } from "../pages/TransparencesPage";
import { SecretariatGeneralPage } from "../pages/SecretariatGeneralPage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <HomePage />,
    children: [
      {
        index: true,
        element: <TransparencesPage />,
      },
      {
        path: "transparences",
        element: <TransparencesPage />,
      },
      {
        path: "secretariat-general",
        element: <SecretariatGeneralPage />,
      },
    ],
  },
]);

export const AppRouter = () => {
  return <RouterProvider router={router} />;
};
