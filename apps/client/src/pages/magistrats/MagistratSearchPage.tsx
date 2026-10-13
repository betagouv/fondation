import { useIsSgNavigation } from '@/features/auth/hooks/roles.hook';
import { MagistratSearch } from '@/features/magistrats/components/MagistratSearch';

export function MagistratSearchPage() {
  const isSgContext = useIsSgNavigation();

  return (
    <div className="fr-container fr-py-8v">
      <MagistratSearch context={isSgContext ? 'sg' : 'membre'} />
    </div>
  );
}
