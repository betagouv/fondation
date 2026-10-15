import { ArchivedSessions } from '@/features/sessions/components/ArchivedSessions';

export const ArchivedSessionsPage = () => {
  return (
    <div className="fr-container fr-pt-8v fr-pb-16v">
      <ArchivedSessions space="SG" withFormationFilter />
    </div>
  );
};
