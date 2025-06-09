import { ButtonsGroup } from "@codegouvfr/react-dsfr/ButtonsGroup";
import Input from "@codegouvfr/react-dsfr/Input";
import Select from "@codegouvfr/react-dsfr/Select";
import { Upload } from "@codegouvfr/react-dsfr/Upload";
import { zodResolver } from "@hookform/resolvers/zod";
import { FC } from "react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { Magistrat } from "shared-models";
import { z } from "zod";
import {
  useAppDispatch,
  useAppSelector,
} from "../../../../../reports/adapters/primary/hooks/react-redux";
import { formationToLabel } from "../../../../../reports/adapters/primary/labels/labels-mappers";
import { Breadcrumb } from "../../../../../shared-kernel/adapters/primary/react/Breadcrumb";
import { PageContentLayout } from "../../../../../shared-kernel/adapters/primary/react/PageContentLayout";
import { dataAdministrationUpload } from "../../../../core-logic/use-cases/data-administration-upload/dataAdministrationUpload.use-case";
import {
  BreadcrumCurrentPage,
  selectBreadcrumb,
} from "../../selectors/selectBreadcrumb";

const optionalDate = z.string().date("La date est requise").optional();

const nouvelleTransparenceDtoSchema = z.object({
  nomTransparence: z.string().min(1, "Le nom de la transparence est requis."),
  dateTransparence: z
    .string()
    .min(1, "La date de la transparence est requise."),
  formation: z.nativeEnum(Magistrat.Formation, {
    message: "La formation est requise.",
  }),
  dateEcheance: z.string().date(),
  datePriseDePosteCible: optionalDate,
  dateClôtureDélaiObservation: optionalDate,
  fichier: z
    .instanceof(File, { message: "Un fichier est requis." })
    .refine((file) => file.size > 0, {
      message: "Le fichier de la transparence est requis.",
    })
    .refine(
      (file) => {
        const validTypes = [
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ];
        return validTypes.includes(file.type);
      },
      { message: "Veuillez importer un fichier au bon format." },
    ),
});

type FormSchema = z.infer<typeof nouvelleTransparenceDtoSchema>;

const NouvelleTransparence: FC = () => {
  const dispatch = useAppDispatch();
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
  } = useForm<FormSchema>({
    resolver: zodResolver(nouvelleTransparenceDtoSchema),
  });

  const onSubmit: SubmitHandler<FormSchema> = (data) => {
    dispatch(
      dataAdministrationUpload({
        ...data,
        nomTransparence: data.nomTransparence.trim(),
        datePriseDePosteCible: data.datePriseDePosteCible || null,
        dateClotureDelaiObservation: data.dateClôtureDélaiObservation || null,
      }),
    );
  };

  return (
    <PageContentLayout>
      <Breadcrumb
        id="sg-nouvelle-transparence-breadcrumb"
        ariaLabel="Fil d'Ariane du secrétariat général"
        breadcrumb={breadcrumb}
      />
      <form className="m-auto max-w-[480px]" onSubmit={handleSubmit(onSubmit)}>
        <Controller<FormSchema, "nomTransparence">
          name="nomTransparence"
          control={control}
          render={({ field: { value, onChange, ...field } }) => (
            <Input
              label="Nom de la transparence*"
              id="transparence-name"
              nativeInputProps={{
                value,
                onChange,
                ...field,
                placeholder: "Nom de la transparence",
              }}
              state={errors.nomTransparence ? "error" : "default"}
              stateRelatedMessage={errors.nomTransparence?.message}
            />
          )}
        />
        <Controller<FormSchema, "dateTransparence">
          name="dateTransparence"
          control={control}
          render={({ field: { value, onChange, ...field } }) => (
            <Input
              label="Date de la transparence*"
              id="date-transparence"
              nativeInputProps={{
                type: "date",
                value,
                onChange,
                ...field,
              }}
              state={errors.dateTransparence ? "error" : "default"}
              stateRelatedMessage={errors.dateTransparence?.message}
            />
          )}
        />
        <Controller<FormSchema, "formation">
          name="formation"
          control={control}
          render={({ field: { value, onChange } }) => (
            <Select
              label="Formation*"
              nativeSelectProps={{
                value,
                onChange,
              }}
              state={errors.formation ? "error" : "default"}
              stateRelatedMessage={errors.formation?.message}
            >
              <option disabled selected value={""}></option>
              <option value={Magistrat.Formation.SIEGE}>
                {formationToLabel(Magistrat.Formation.SIEGE)}
              </option>
              <option value={Magistrat.Formation.PARQUET}>
                {formationToLabel(Magistrat.Formation.PARQUET)}
              </option>
            </Select>
          )}
        />
        <Controller<FormSchema, "dateClôtureDélaiObservation">
          name="dateClôtureDélaiObservation"
          control={control}
          render={({ field: { value, onChange, ...field } }) => (
            <Input
              label="Clôture du délai d'observation"
              id="date-cloture-delai-observation"
              nativeInputProps={{
                type: "date",
                value,
                onChange,
                ...field,
              }}
              state={errors.dateClôtureDélaiObservation ? "error" : "default"}
              stateRelatedMessage={errors.dateClôtureDélaiObservation?.message}
            />
          )}
        />
        <Controller<FormSchema, "dateEcheance">
          name="dateEcheance"
          control={control}
          render={({ field: { value, onChange, ...field } }) => (
            <Input
              label="Date d'échéance*"
              id="date-echeance"
              nativeInputProps={{
                type: "date",
                value,
                onChange,
                ...field,
              }}
              state={errors.dateEcheance ? "error" : "default"}
              stateRelatedMessage={errors.dateEcheance?.message}
            />
          )}
        />
        <Controller<FormSchema, "datePriseDePosteCible">
          name="datePriseDePosteCible"
          control={control}
          render={({ field: { value, onChange, ...field } }) => (
            <Input
              label="Date de prise de poste"
              id="date-prise-de-poste"
              nativeInputProps={{
                type: "date",
                value,
                onChange,
                ...field,
              }}
              state={errors.datePriseDePosteCible ? "error" : "default"}
              stateRelatedMessage={errors.datePriseDePosteCible?.message}
            />
          )}
        />
        <Controller<FormSchema, "fichier">
          name="fichier"
          control={control}
          render={({ field: { onChange } }) => (
            <Upload
              id="nouvelle-transparence-file-upload"
              className="mb-4"
              nativeInputProps={{
                type: "file",
                onChange: (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    onChange(file);
                  }
                },
              }}
              hint="Format supporté : xlsx."
              label="Fichier*"
              state={errors.fichier ? "error" : "default"}
              stateRelatedMessage={errors.fichier?.message}
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
                reset();
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

export default NouvelleTransparence;
