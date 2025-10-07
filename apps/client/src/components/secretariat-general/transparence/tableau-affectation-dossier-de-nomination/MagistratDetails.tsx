import type { FC } from 'react';
import type { ContenuPropositionDeNominationTransparenceV2 } from 'shared-models/models/session/contenu-transparence-par-version/proposition-content';
import {
  formatBiography,
  formatBirthDate,
  formatDurationFromDate,
  formatObservers
} from '../../../reports/components/ReportOverview/ReportOverview';
import { TextValue } from '../../../shared/TextValue';
import { ReportVM } from '../../../../VM/ReportVM';
import { reportHtmlIds } from '../../../reports/dom/html-ids';
import { useGetReportsByDnId } from '../../../../react-query/queries/sg/get-reports-by-dn-id.query';
import { ErrorMessage } from '../../../shared/ErrorMessage';
import { useIsModalOpen } from '@codegouvfr/react-dsfr/Modal/useIsModalOpen';
import { ReportStateTag } from '../../../reports/components/ReportList/ReportStateTag';
import { stateToLabel } from '../../../reports/labels/state-label.mapper';

export type MagistratDetailsProps = {
  content: ContenuPropositionDeNominationTransparenceV2;
  idDn: string;
};

export const MagistratDetails: FC<MagistratDetailsProps> = ({ content, idDn }) => {
  // Créer une référence à la modale pour détecter son état
  const modalRef = { id: `modal-magistrat-dn-details-${idDn}`, isOpenedByDefault: false };
  const isModalOpen = useIsModalOpen(modalRef);

  const {
    data: reports,
    isLoading,
    error
  } = useGetReportsByDnId(idDn, {
    enabled: isModalOpen
  });

  if (isLoading) {
    return <div>Chargement des rapports...</div>;
  }

  if (error) {
    return <ErrorMessage message="Erreur lors du chargement des rapports" />;
  }

  const {
    dateDeNaissance,
    observants,
    historique,
    grade,
    posteActuel,
    posteCible,
    rang,
    datePriseDeFonctionPosteActuel
  } = content;

  const formattedBirthDate = formatBirthDate(dateDeNaissance, new Date());
  const formattedObservers = formatObservers(observants);
  const formattedBiography = formatBiography(historique);

  const dureeDuPoste = datePriseDeFonctionPosteActuel
    ? formatDurationFromDate(
        new Date(
          datePriseDeFonctionPosteActuel.year,
          datePriseDeFonctionPosteActuel.month - 1,
          datePriseDeFonctionPosteActuel.day
        )
      )
    : null;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <label className="text-xl font-semibold">{ReportVM.reportersLabel}</label>
        {(reports || []).map((report) => (
          <div key={report.id}>
            <p className="flex items-center justify-between py-2">
              <span>{report.name}</span>
              <ReportStateTag state={stateToLabel(report.state)} />
            </p>
          </div>
        ))}
      </div>
      <div>
        <TextValue
          label={ReportVM.magistratIdentityLabels.currentPosition}
          value={`${posteActuel} - ${grade}`}
        />
        {dureeDuPoste && (
          <TextValue label={ReportVM.magistratIdentityLabels.dureeDuPoste} value={dureeDuPoste} />
        )}
        <TextValue label={ReportVM.magistratIdentityLabels.targettedPosition} value={posteCible} />
        <TextValue label={ReportVM.magistratIdentityLabels.rank} value={rang} />
        <TextValue label={ReportVM.magistratIdentityLabels.birthDate} value={formattedBirthDate} />
      </div>
      <div>
        <label className="text-xl font-semibold" id={reportHtmlIds.overview.biography}>
          {ReportVM.observersLabel}
        </label>
        <div
          aria-labelledby={reportHtmlIds.overview.biography}
          className="w-full whitespace-pre-line leading-7"
        >
          {formattedObservers ?? 'Non renseigné'}
        </div>
      </div>

      <div>
        <label className="text-xl font-semibold" id={reportHtmlIds.overview.biography}>
          {ReportVM.biographyLabel}
        </label>
        <div
          aria-labelledby={reportHtmlIds.overview.biography}
          className="w-full whitespace-pre-line leading-7"
        >
          {formattedBiography}
        </div>
      </div>
    </div>
  );
};
