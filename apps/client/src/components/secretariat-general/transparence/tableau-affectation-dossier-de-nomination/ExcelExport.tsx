import Button from '@codegouvfr/react-dsfr/Button';
import type { FC } from 'react';
import type { ContenuPropositionDeNominationTransparenceV2 } from 'shared-models/models/session/contenu-transparence-par-version/proposition-content';
import type { DossierDeNominationEtAffectationSnapshot } from 'shared-models/models/session/dossier-de-nomination';
import * as XLSX from 'xlsx';

export type ExcelExportProps = {
  data: DossierDeNominationEtAffectationSnapshot[];
};

export const ExcelExport: FC<ExcelExportProps> = ({ data }) => {
  const exportToExcel = () => {
    if (!data || data.length === 0) return;

    const exportData = data.map((dossier) => {
      const content = dossier.content as ContenuPropositionDeNominationTransparenceV2;
      return {
        'N°': content.numeroDeDossier,
        Magistrat: content.nomMagistrat,
        'Poste actuel': content.posteActuel,
        'Grade actuel': content.grade,
        'Poste cible': content.posteCible,
        Observants: Array.isArray(content.observants) ? content.observants.join(', ') : content.observants,
        Priorité: 'priorité',
        'Rapporteur(s)': dossier.rapporteurs.join(', ')
      };
    });

    // Créer le workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);

    // Ajuster la largeur des colonnes
    const colWidths = [
      { wch: 10 }, // N°
      { wch: 25 }, // Magistrat
      { wch: 30 }, // Poste actuel
      { wch: 20 }, // Grade actuel
      { wch: 30 }, // Poste cible
      { wch: 25 }, // Observants
      { wch: 15 }, // Priorité
      { wch: 30 } // Rapporteur(s)
    ];
    ws['!cols'] = colWidths;
    XLSX.utils.book_append_sheet(wb, ws, 'Dossiers de nomination');

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const fileName = `dossiers-nomination-${dateStr}.xlsx`;

    XLSX.writeFile(wb, fileName);
  };

  return (
    <Button iconId="fr-icon-download-line" onClick={exportToExcel} disabled={!data || data.length === 0}>
      Exporter en Excel
    </Button>
  );
};
