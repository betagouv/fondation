import "./App.css";
import { Outlet } from "react-router-dom";
import { PageLayout } from "./components/layout/PageLayout";

export const App = () => {
  return (
    <PageLayout>
      <Outlet />
    </PageLayout>
  );
};

export default App;
