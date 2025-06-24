import "./App.css";
// import { PageLayout } from "./components/layout/PageLayout";
import { Outlet } from "react-router-dom";

export const App = () => {
  return (
    // <PageLayout>
    <Outlet />
    // </PageLayout>
  );
};

export default App;
