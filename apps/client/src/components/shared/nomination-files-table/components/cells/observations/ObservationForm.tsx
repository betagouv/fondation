import { Input } from '@codegouvfr/react-dsfr/Input';
import SearchBar from '@codegouvfr/react-dsfr/SearchBar';
import { Upload } from '@codegouvfr/react-dsfr/Upload';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useRef, useState, type FC } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useDebounce } from 'use-debounce';
import { z } from 'zod';

import {
  useCreateObservationMutation,
  useSearchMagistratsQuery,
  useUpdateObservationMutation,
  type MagistratSearchResult,
  type Observation
} from '@queries/observations.queries';

const ACCEPTED_FILE_TYPES = '.jpg,.jpeg,.png,.pdf,.doc,.docx';

const observationFormSchema = z.object({
  magistratId: z.string().min(1, 'Champ obligatoire'),
  dateReception: z.string().min(1, 'Champ obligatoire'),
  files: z.array(z.instanceof(File)).optional()
});

type FormSchema = z.infer<typeof observationFormSchema>;

export const ObservationForm: FC<{
  sessionId: string;
  nominationFileId: string;
  nominationFileName: string;
  observation?: Observation;
  onSuccess?: () => void;
}> = ({ sessionId, nominationFileId, observation, onSuccess }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isEditing = !!observation;

  const {
    control,
    handleSubmit: handleFormSubmit,
    reset,
    setValue,
    watch,
    formState: { errors }
  } = useForm<FormSchema>({
    resolver: zodResolver(observationFormSchema),
    defaultValues: {
      magistratId: observation?.magistrat?.id ?? '',
      dateReception: observation?.dateReception?.split('T')[0] ?? '',
      files: []
    },
    mode: 'onChange'
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch] = useDebounce(searchTerm, 400);
  const [selectedMagistrat, setSelectedMagistrat] = useState<MagistratSearchResult | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [existingFiles, setExistingFiles] = useState<Observation['files']>(observation?.files ?? []);
  const [filesToDetach, setFilesToDetach] = useState<string[]>([]);

  const { data: displayedMagistrats, isLoading: isSearching } = useSearchMagistratsQuery(debouncedSearch);
  const { mutate: createObservation, reset: resetCreateMutation } = useCreateObservationMutation();
  const { mutate: updateObservation, reset: resetUpdateMutation } = useUpdateObservationMutation();

  const files = watch('files') ?? [];

  useEffect(() => {
    if (observation?.magistrat) {
      setSelectedMagistrat({
        id: observation.magistrat.id,
        firstName: observation.magistrat.firstName,
        lastName: observation.magistrat.lastName,
        usedName: '',
        grade: null,
        currentPosition: observation.magistrat.currentPosition ?? null
      });
      setSearchTerm(`${observation.magistrat.lastName} ${observation.magistrat.firstName}`);
    }
  }, [observation]);

  const handleRemoveExistingFile = (fileId: string) => {
    setExistingFiles((prev) => prev.filter((f) => f.id !== fileId));
    setFilesToDetach((prev) => [...prev, fileId]);
  };

  const resetForm = () => {
    reset();
    setSearchTerm('');
    setSelectedMagistrat(null);
    setShowResults(false);
    setExistingFiles([]);
    setFilesToDetach([]);
    resetCreateMutation();
    resetUpdateMutation();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const onSubmit = (data: FormSchema) => {
    if (isEditing) {
      updateObservation(
        {
          sessionId,
          observationId: observation.id,
          nominationFileId,
          magistratId: data.magistratId,
          dateReception: data.dateReception,
          files: data.files,
          detachFileIds: filesToDetach
        },
        {
          onSuccess: () => {
            resetForm();
            onSuccess?.();
          }
        }
      );
    } else {
      createObservation(
        {
          sessionId,
          nominationFileId,
          magistratId: data.magistratId,
          dateReception: data.dateReception,
          files: data.files ?? []
        },
        {
          onSuccess: () => {
            resetForm();
            onSuccess?.();
          }
        }
      );
    }
  };

  const handleMagistratSelect = (magistrat: MagistratSearchResult) => {
    setSelectedMagistrat(magistrat);
    setValue('magistratId', magistrat.id);
    setSearchTerm(`${magistrat.lastName} ${magistrat.firstName}`);
    setShowResults(false);
  };

  const handleMagistratClear = () => {
    setSelectedMagistrat(null);
    setValue('magistratId', '');
    setSearchTerm('');
  };

  return (
    <form id="observation-form" onSubmit={handleFormSubmit(onSubmit)} className="flex flex-col gap-6">
      <Controller
        name="dateReception"
        control={control}
        render={({ field }) => (
          <Input
            label="Date de réception"
            state={errors.dateReception ? 'error' : 'default'}
            stateRelatedMessage={errors.dateReception?.message}
            nativeInputProps={{
              type: 'date',
              value: field.value,
              onChange: field.onChange,
              required: true
            }}
          />
        )}
      />

      <div className="relative">
        <label className="fr-label mb-2 block">
          Magistrat observant <span className="text-red-500">*</span>
        </label>
        <SearchBar
          renderInput={(props) => (
            <input
              {...props}
              role="combobox"
              aria-expanded={showResults && debouncedSearch.length >= 2}
              aria-controls="magistrat-listbox"
              aria-autocomplete="list"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setShowResults(true);
                if (e.target.value === '') {
                  setSelectedMagistrat(null);
                  setValue('magistratId', '');
                }
              }}
              onFocus={() => setShowResults(true)}
              placeholder="Rechercher un magistrat..."
            />
          )}
        />
        {errors.magistratId && <p className="fr-error-text mt-1">{errors.magistratId.message}</p>}
        {showResults && debouncedSearch.length >= 2 && (
          <div
            id="magistrat-listbox"
            role="listbox"
            className="absolute mt-1 max-h-60 w-full overflow-y-auto rounded border bg-white shadow-lg"
            style={{ zIndex: 9999 }}
          >
            {isSearching ? (
              <div className="p-3 text-sm text-gray-500">Recherche...</div>
            ) : (displayedMagistrats ?? []).length === 0 ? (
              <div className="p-3 text-sm text-gray-500">Aucun résultat</div>
            ) : (
              (displayedMagistrats ?? []).map((magistrat) => (
                <button
                  key={magistrat.id}
                  type="button"
                  role="option"
                  aria-selected={selectedMagistrat?.id === magistrat.id}
                  className="w-full cursor-pointer border-b p-3 text-left hover:bg-gray-100"
                  onClick={() => handleMagistratSelect(magistrat)}
                >
                  <div className="font-medium">
                    {magistrat.lastName} {magistrat.firstName}
                  </div>
                  <div className="text-xs text-gray-500">
                    {magistrat.grade && <span>{magistrat.grade}</span>}
                    {magistrat.currentPosition && <span className="ml-2">- {magistrat.currentPosition}</span>}
                  </div>
                </button>
              ))
            )}
          </div>
        )}
        {selectedMagistrat && (
          <div className="mt-2 flex items-center gap-2 rounded bg-blue-50 p-2">
            <span className="text-sm">
              {selectedMagistrat.lastName} {selectedMagistrat.firstName}
              {selectedMagistrat.currentPosition && ` - ${selectedMagistrat.currentPosition}`}
            </span>
            <button
              type="button"
              className="ml-auto text-red-600 hover:text-red-800"
              onClick={handleMagistratClear}
            >
              <i className="ri-close-line" />
            </button>
          </div>
        )}
      </div>

      {isEditing && existingFiles.length > 0 && (
        <div>
          <label className="fr-label mb-2 block">Fichiers existants</label>
          <div className="flex flex-wrap gap-2">
            {existingFiles.map((file) => (
              <div key={file.id} className="flex items-center gap-2 rounded bg-gray-100 px-3 py-2">
                <i className="ri-file-line" />
                <span className="text-sm">{file.name}</span>
                <button
                  type="button"
                  className="ml-2 text-red-600 hover:text-red-800"
                  onClick={() => handleRemoveExistingFile(file.id)}
                  title="Supprimer ce fichier"
                >
                  <i className="ri-close-line" />
                </button>
              </div>
            ))}
          </div>
          {filesToDetach.length > 0 && (
            <div className="mt-2 text-sm text-orange-600">
              {filesToDetach.length > 1
                ? `${filesToDetach.length} fichiers seront supprimés`
                : `1 fichier sera supprimé`}
            </div>
          )}
        </div>
      )}

      <Controller
        name="files"
        control={control}
        render={({ field }) => (
          <Upload
            label={isEditing ? 'Ajouter des fichiers (optionnel)' : 'Pièces jointes (optionnel)'}
            hint="Formats acceptés: JPEG, PNG, PDF, Word"
            nativeInputProps={{
              ref: fileInputRef,
              multiple: true,
              accept: ACCEPTED_FILE_TYPES,
              onChange: (e) => {
                if (e.target.files) {
                  field.onChange(Array.from(e.target.files));
                }
              }
            }}
          />
        )}
      />
      {files.length > 0 && (
        <div className="text-sm text-gray-600">
          {files.length} nouveau{files.length > 1 ? 'x' : ''} fichier{files.length > 1 ? 's' : ''} sélectionné
          {files.length > 1 ? 's' : ''}
        </div>
      )}
    </form>
  );
};
