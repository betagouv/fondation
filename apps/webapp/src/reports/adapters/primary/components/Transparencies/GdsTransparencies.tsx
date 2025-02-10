import { Tabs } from "@codegouvfr/react-dsfr/Tabs";
import { Magistrat } from "shared-models";
import { ReportTransparenciesVM } from "../../selectors/selectTransparencies";

export type IGdsTransparencies = {
  gdsTransparencies: ReportTransparenciesVM["GARDE DES SCEAUX"];
};

export const GdsTransparencies = ({
  gdsTransparencies,
}: IGdsTransparencies) => {
  const genTabFor = (formation: Magistrat.Formation) => {
    const { label, values: transparenciesLabels } =
      gdsTransparencies[formation];

    return transparenciesLabels?.length
      ? {
          label,
          content: (
            <ul>
              {transparenciesLabels.map((transparencyLabel) => (
                <li key={transparencyLabel}>{transparencyLabel}</li>
              ))}
            </ul>
          ),
        }
      : [];
  };

  const tabs = [
    genTabFor(Magistrat.Formation.SIEGE),
    genTabFor(Magistrat.Formation.PARQUET),
  ].flat();

  return (
    <div
      style={{
        display: gdsTransparencies.noGdsTransparencies ? "none" : "block",
      }}
    >
      <h2>Pouvoir de proposition du garde des Sceaux</h2>
      <Tabs tabs={tabs} />
    </div>
  );
};
