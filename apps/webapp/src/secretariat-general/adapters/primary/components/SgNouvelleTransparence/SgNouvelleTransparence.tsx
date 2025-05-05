import Input from "@codegouvfr/react-dsfr/Input";
import { ButtonsGroup } from "@codegouvfr/react-dsfr/ButtonsGroup";
import { RadioButtons } from "@codegouvfr/react-dsfr/RadioButtons";
import { formationToLabel } from "../../../../../reports/adapters/primary/labels/labels-mappers";
import { Magistrat } from "shared-models";

/* TODO AJOUTER DES VALIDATEURS ICI, ZOD OU REQUIRED PEUVENT SUFFIRE */
// RECUPERER LES VALEURS DANS UN FORMULAIRE

export const SgNouvelleTransparence = () => {
  const nativeInputProps = {
    autoCorrect: "off",
    autoCapitalize: "off",
    autoComplete: "email",
    spellCheck: false,
    required: true,
  };

  return (
    <form className="m-auto max-w-[480px]">
      <Input
        label="Nom de la transparence"
        id="transparence-name"
        nativeInputProps={{ ...nativeInputProps }}
      />
      <Input label="Date d'échéance" id="date-echeance" {...nativeInputProps} />
      <RadioButtons
        legend="Formation"
        name="formation"
        orientation="horizontal"
        options={[
          {
            label: formationToLabel(Magistrat.Formation.SIEGE),
            nativeInputProps: {
              value: Magistrat.Formation.SIEGE,
            },
          },
          {
            label: formationToLabel(Magistrat.Formation.PARQUET),
            nativeInputProps: {
              value: Magistrat.Formation.PARQUET,
            },
          },
        ]}
      />
      <ButtonsGroup
        buttons={[
          {
            id: "annuler",
            children: "Annuler",
            priority: "tertiary",
          },
          {
            id: "enregistrer",
            children: "Enregistrer",
            type: "submit",
          },
        ]}
        inlineLayoutWhen="always"
      />
    </form>
  );
};
