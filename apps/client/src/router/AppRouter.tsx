import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { App } from "../App";
import { TransparencesPage } from "../pages/TransparencesPage";
import { SecretariatGeneralPage } from "../pages/SecretariatGeneralPage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
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
