import { SummaryContext } from '@/pages/summary/SummaryContext';
import { SideMenu } from '@codegouvfr/react-dsfr/SideMenu';
import { useContext } from 'react';

export function SummarySideNav() {
  const { sections } = useContext(SummaryContext);

  return (
    <SideMenu
      align="left"
      title="SECTIONS"
      burgerMenuButtonText="SECTIONS"
      items={sections.map((anchor) => ({
        text: anchor.label,
        linkProps: { href: `#${anchor.id}` }
      }))}
    />
  );
}
