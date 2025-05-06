import Input from "@codegouvfr/react-dsfr/Input";
import { ButtonsGroup } from "@codegouvfr/react-dsfr/ButtonsGroup";
import { RadioButtons } from "@codegouvfr/react-dsfr/RadioButtons";
import { formationToLabel } from "../../../../../reports/adapters/primary/labels/labels-mappers";
import { Magistrat } from "shared-models";
import { useForm, SubmitHandler, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const schema = z.object({
  transparenceName: z.string().min(1, "Le nom de la transparence est requise"),
  dateEcheance: z
    .string()
    .min(1, "La date d'écheance de la transparenceest requise"),
  formation: z.nativeEnum(Magistrat.Formation),
});

type Schema = z.infer<typeof schema>;

const defaultValues: Schema = {
  transparenceName: "",
  dateEcheance: "",
  formation: Magistrat.Formation.SIEGE,
};

export const SgNouvelleTransparence = () => {
  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<Schema>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const onSubmit: SubmitHandler<Schema> = (data) => {
    console.log("Form submitted:", data);
  };

  return (
    <form className="m-auto max-w-[480px]" onSubmit={handleSubmit(onSubmit)}>
      <Controller
        name="transparenceName"
        control={control}
        render={({ field: { value, onChange, ...field } }) => (
          <Input
            label="Nom de la transparence"
            id="transparence-name"
            nativeInputProps={{
              value: value || "",
              onChange,
              ...field,
            }}
            state={errors.transparenceName ? "error" : "default"}
            stateRelatedMessage={errors.transparenceName?.message}
          />
        )}
      />
      <Controller
        name="dateEcheance"
        control={control}
        render={({ field: { value, onChange, ...field } }) => (
          <Input
            label="Date d'échéance"
            id="date-echeance"
            nativeInputProps={{
              type: "date",
              value: value || "",
              onChange,
              ...field,
            }}
            state={errors.dateEcheance ? "error" : "default"}
            stateRelatedMessage={errors.dateEcheance?.message}
          />
        )}
      />
      <Controller
        name="formation"
        control={control}
        render={({ field: { value, onChange } }) => (
          <RadioButtons
            legend="Formation"
            orientation="horizontal"
            options={[
              {
                label: formationToLabel(Magistrat.Formation.SIEGE),
                nativeInputProps: {
                  value: Magistrat.Formation.SIEGE,
                  checked: value === Magistrat.Formation.SIEGE,
                  onChange: () => onChange(Magistrat.Formation.SIEGE),
                },
              },
              {
                label: formationToLabel(Magistrat.Formation.PARQUET),
                nativeInputProps: {
                  value: Magistrat.Formation.PARQUET,
                  checked: value === Magistrat.Formation.PARQUET,
                  onChange: () => onChange(Magistrat.Formation.PARQUET),
                },
              },
            ]}
          />
        )}
      />
      <ButtonsGroup
        buttons={[
          {
            id: "annuler",
            children: "Annuler",
            priority: "tertiary",
            type: "reset",
            onClick: () => {
              reset(defaultValues);
            },
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
