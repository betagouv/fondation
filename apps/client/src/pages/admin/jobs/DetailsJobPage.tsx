import Button from '@codegouvfr/react-dsfr/Button';
import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import clsx from 'clsx';
import React from 'react';
import { useOutletContext, useParams } from 'react-router';

import { useDetailsJobQuery } from '@queries/jobs.queries';

import { JOB_STATUS_ICONS } from './common/job-status.utils';
import type { JobsPageOutletContextType } from './common/jobs-page-outlet-context.type';
import { JobFilesTree } from './components/JobFilesTree';
import { useSelectedJob } from './contexts';

export function DetailsJobPage() {
  const params = useParams<{ jobId: string }>();
  const jobId = parseInt(String(params.jobId), 10);
  const { status } = useOutletContext<JobsPageOutletContextType>();
  const { data: job, isLoading } = useDetailsJobQuery({ jobId });
  const { selectedFileId, toggleFile } = useSelectedJob();

  const { icon, textColor } = React.useMemo(
    () => JOB_STATUS_ICONS[job?.status ?? status ?? 'IDLE'],
    [job, status],
  );
  const selectedFile = React.useMemo(
    () => (selectedFileId ? (job?.files ?? []).find((file) => file.id === selectedFileId) : undefined),
    [selectedFileId, job],
  );

  const entityName = React.useMemo(() => {
    switch (selectedFile?.name) {
      case 'MAGISTRATS.xml':
        return 'Magistrat';
      case 'POSADS.xml':
        return 'Position administrative';
      case 'POSTE_2.xml':
        return 'Poste';
      case 'TYPE_JURIDICTION.xml':
        return 'Type de juridiction';
      case 'JURIDICTIONS.xml':
        return 'Juridiction';
      case 'CANDIDATS.xml':
        return 'Candidat';
      case 'DESIDERATA.xml':
        return 'Desiderata';
      case 'GRADES.xml':
        return 'Grade';
      case 'FONCTIONS.xml':
        return 'Fonction';
      case 'SESSION.xml':
        return 'Session';
      case 'TRANSPARENCES.xml':
        return 'Transparence';
    }
  }, [selectedFile]);

  return (
    <div className="mt-7 max-w-full">
      <h1 className="fr-h3">
        <i
          className={`${icon} before:mr-2 before:size-6 before:align-middle before:content-[""] ${textColor}`}
        />
        <span>Job #{jobId}</span>
      </h1>

      {isLoading && <p>Chargement…</p>}

      <JobFilesTree files={job?.files ?? []} />

      {selectedFile && (
        <div className="mt-4 w-full rounded border border-solid border-gray-300 p-6">
          <header className="flex items-start justify-between">
            <h2 className="fr-h5">Erreurs {selectedFile.name}</h2>
            <Button
              size="small"
              priority="tertiary no outline"
              iconId="fr-icon-close-line"
              iconPosition="left"
              onClick={() => toggleFile(selectedFileId)}
            >
              FERMER
            </Button>
          </header>
          {selectedFile.errors.length > 0 ? (
            <ul className="m-0 list-none p-0">
              {selectedFile.errors.map((e, i) => (
                <li key={i}>
                  {e.entityNumber != null ? `${entityName} n°\u00A0${e.entityNumber}: ` : ''}
                  {e.entityId != null ? (
                    <span>
                      <span className="text-sm font-bold">
                        {entityName} #{e.entityId}
                      </span>
                      :&nbsp;
                    </span>
                  ) : (
                    ''
                  )}
                  {e.error}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-600">Aucune erreur</p>
          )}
        </div>
      )}

      {(job?.errors ?? []).length > 0 ? (
        <div className="mt-4 w-full rounded border border-solid border-gray-300 p-6 shadow">
          <h2 className="fr-h5">
            <i
              className={clsx(
                cx('ri-close-circle-fill'),
                'mr-1 before:align-middle before:content-[""]',
                textColor,
              )}
            />
            Erreurs
          </h2>
          {(job?.errors ?? []).map(({ error }, i) => (
            <pre
              className="overflow-scroll rounded bg-gray-100 p-4 font-mono text-sm"
              key={`job_${job?.id}_error_${i}`}
            >
              {error}
            </pre>
          ))}
        </div>
      ) : null}
    </div>
  );
}
