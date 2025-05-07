import { ButtonsGroup } from "@codegouvfr/react-dsfr/ButtonsGroup";
import Input from "@codegouvfr/react-dsfr/Input";
import { RadioButtons } from "@codegouvfr/react-dsfr/RadioButtons";
import { zodResolver } from "@hookform/resolvers/zod";
import { FC } from "react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { Magistrat } from "shared-models";
import { z } from "zod";
import { useAppSelector } from "../../../../../reports/adapters/primary/hooks/react-redux";
import { formationToLabel } from "../../../../../reports/adapters/primary/labels/labels-mappers";
import {
  BreadcrumCurrentPage,
  selectBreadcrumb,
} from "../../../../../router/adapters/selectors/selectBreadcrumb";
import { Breadcrumb } from "../../../../../shared-kernel/adapters/primary/react/Breadcrumb";
import { PageContentLayout } from "../../../../../shared-kernel/adapters/primary/react/PageContentLayout";

const schema = z.object({
  transparenceName: z.string().min(1, "Le nom de la transparence est requise"),
  dateEcheance: z
    .string()
    .min(1, "La date d'écheance de la transparence est requise"),
  formation: z.nativeEnum(Magistrat.Formation),
});

type Schema = z.infer<typeof schema>;

const defaultValues: Schema = {
  transparenceName: "",
  dateEcheance: "",
  formation: Magistrat.Formation.SIEGE,
};

const SgNouvelleTransparence: FC = () => {
  const currentPage = {
    name: BreadcrumCurrentPage.sgNouvelleTransparence,
  } as const;
  const breadcrumb = useAppSelector((state) =>
    selectBreadcrumb(state, currentPage),
  );

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
    <PageContentLayout>
      <Breadcrumb
        id="sg-nouvelle-transparence-breadcrumb"
        ariaLabel="Fil d'Ariane du secrétariat général"
        breadcrumb={breadcrumb}
      />
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
    </PageContentLayout>
  );
};

export default SgNouvelleTransparence;
