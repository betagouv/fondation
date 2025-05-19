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

const defaultValues: NouvelleTransparenceDto = {
  transparenceName: "",
  transparenceDate: "",
  dateEcheance: "",
  jobDate: "",
  formation: Magistrat.Formation.SIEGE,
  fichier: new File([], "", { type: "application/octet-stream" }),
};

const nouvelleTransparenceDtoSchema = z.object({
  transparenceName: z.string().min(1, "Le nom de la transparence est requis."),
  transparenceDate: z
    .string()
    .min(1, "La date de la transparence est requise."),
  formation: z.nativeEnum(Magistrat.Formation),
  dateEcheance: z.string(),
  jobDate: z.string(),
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

export type NouvelleTransparenceDto = z.infer<
  typeof nouvelleTransparenceDtoSchema
>;

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
  } = useForm<NouvelleTransparenceDto>({
    resolver: zodResolver(nouvelleTransparenceDtoSchema),
    defaultValues,
  });

  const onSubmit: SubmitHandler<NouvelleTransparenceDto> = (data) => {
    dispatch(dataAdministrationUpload(data));
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
              label="Nom de la transparence*"
              id="transparence-name"
              nativeInputProps={{
                value: value || "",
                onChange,
                ...field,
                placeholder: "Nom de la transparence",
              }}
              state={errors.transparenceName ? "error" : "default"}
              stateRelatedMessage={errors.transparenceName?.message}
            />
          )}
        />
        <Controller
          name="transparenceDate"
          control={control}
          render={({ field: { value, onChange, ...field } }) => (
            <Input
              label="Date de la transparence*"
              id="date-transparence"
              nativeInputProps={{
                type: "date",
                value: value || "",
                onChange,
                ...field,
              }}
              state={errors.transparenceDate ? "error" : "default"}
              stateRelatedMessage={errors.transparenceDate?.message}
            />
          )}
        />
        <Controller
          name="formation"
          control={control}
          render={({ field: { value, onChange } }) => (
            <Select
              label="Formation*"
              nativeSelectProps={{
                value,
                onChange,
              }}
            >
              <option value={Magistrat.Formation.SIEGE}>
                {formationToLabel(Magistrat.Formation.SIEGE)}
              </option>
              <option value={Magistrat.Formation.PARQUET}>
                {formationToLabel(Magistrat.Formation.PARQUET)}
              </option>
            </Select>
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
          name="jobDate"
          control={control}
          render={({ field: { value, onChange, ...field } }) => (
            <Input
              label="Date de la prise de poste"
              id="date-job"
              nativeInputProps={{
                type: "date",
                value: value || "",
                onChange,
                ...field,
              }}
              state={errors.jobDate ? "error" : "default"}
              stateRelatedMessage={errors.jobDate?.message}
            />
          )}
        />
        <Controller
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
                  } else {
                    onChange(
                      new File([], "", { type: "application/octet-stream" }),
                    );
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

export default NouvelleTransparence;
