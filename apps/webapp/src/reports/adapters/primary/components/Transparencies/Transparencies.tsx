import { cx } from "@codegouvfr/react-dsfr/fr/cx";
import { useAppSelector } from "../../hooks/react-redux";
import { useReportsList } from "../../hooks/use-reports-list";
import { selectTransparencies } from "../../selectors/selectTransparencies";
import { CsmTransparencies } from "./CsmTransparencies";
import { GdsTransparencies } from "./GdsTransparencies";
import clsx from "clsx";

export const Transparencies = () => {
  useReportsList();
  const transparencies = useAppSelector(selectTransparencies);
  const gdsTransparencies = transparencies["GARDE DES SCEAUX"];

  return (
    <div className={clsx("gap-10", cx("fr-grid-row"))}>
      <div>
        <h1>Bonjour,</h1>
        <p
          style={{
            display: transparencies.noTransparencies ? undefined : "none",
          }}
        >
          Il n'y a pas de transparences actives.
        </p>
        <p
          style={{
            display: transparencies.noTransparencies ? "none" : undefined,
          }}
          className={cx("fr-text--xl")}
        >
          Sur quel type de saisine souhaitez-vous travailler ?
        </p>
      </div>

      <div className="flex w-full justify-center">
        <div
          className={clsx(
            "flex-row gap-10 md:flex-nowrap md:gap-20 lg:gap-40",
            cx("fr-grid-row"),
          )}
        >
          <GdsTransparencies gdsTransparencies={gdsTransparencies} />
          <CsmTransparencies />
        </div>
      </div>
    </div>
  );
};

export default Transparencies;
