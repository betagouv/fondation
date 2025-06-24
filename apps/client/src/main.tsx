import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { AppRouter } from "./router/AppRouter.tsx";
import { startReactDsfr } from "@codegouvfr/react-dsfr/spa";

startReactDsfr({ defaultColorScheme: "light" });

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppRouter />
  </StrictMode>,
);
