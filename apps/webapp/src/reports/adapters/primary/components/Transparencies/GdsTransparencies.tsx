import { cx } from "@codegouvfr/react-dsfr/fr/cx";
import { Tabs, TabsProps } from "@codegouvfr/react-dsfr/Tabs";
import { Tag } from "@codegouvfr/react-dsfr/Tag";
import clsx from "clsx";
import { Magistrat } from "shared-models";
import { ReportTransparenciesVM } from "../../selectors/selectTransparencies";
import { TransparencyBlock } from "./TransparencyBlock";
import { useState } from "react";
import { formationToLabel } from "../../labels/labels-mappers";

export type IGdsTransparencies = {
  gdsTransparencies: ReportTransparenciesVM["GARDE DES SCEAUX"];
};

export const GdsTransparencies = ({
  gdsTransparencies,
}: IGdsTransparencies) => {
  const [selectedTabLabel, setSelectedTabLabel] = useState<string>();
  const formationsCount = gdsTransparencies.formationsCount;

  const genTabFor = (
    formation: Magistrat.Formation,
  ): TabsProps.Uncontrolled["tabs"][number] | [] => {
    const { formationLabel, transparencies } = gdsTransparencies[formation];

    const isDefaultTab =
      !selectedTabLabel &&
      (formationsCount === 1 ||
        formationLabel === formationToLabel(Magistrat.Formation.SIEGE));
    const isTabSelected = selectedTabLabel === formationLabel;

    return transparencies?.length
      ? {
          label: formationLabel,
          iconId:
            isDefaultTab || isTabSelected
              ? "fr-icon-arrow-right-line"
              : undefined,
          isDefault: isDefaultTab || isTabSelected,
          content: (
            <ul className={clsx("list-none gap-2", cx("fr-grid-row"))}>
              {transparencies.map(({ label, href, onClick }) => (
                <li key={label}>
                  <Tag linkProps={{ href, onClick }}>{label}</Tag>
                </li>
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

  const handleTabChange: TabsProps.Uncontrolled["onTabChange"] = (tab) =>
    setSelectedTabLabel(tab.tab.label as string);

  return (
    <TransparencyBlock
      hidden={gdsTransparencies.noGdsTransparencies}
      title="Pouvoir de proposition du garde des Sceaux"
    >
      <Tabs
        style={{
          height: "auto",
        }}
        tabs={tabs}
        onTabChange={handleTabChange}
      />
    </TransparencyBlock>
  );
};
