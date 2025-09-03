import Footer from '@codegouvfr/react-dsfr/Footer';

export const AppFooter = () => {
  return (
    <Footer
      accessibility="non compliant"
      contentDescription="
Cet outil est réservé aux Secrétariat Général du Conseil Supérieur de la Magistrature et à ses membres.
    "
      license={
        <>
          Sauf mention explicite de propriété intellectuelle détenue par des tiers, les contenus de ce site
          sont proposés sous{' '}
          <a href="https://www.apache.org/licenses/LICENSE-2.0" target="_blank">
            licence Apache 2.0
          </a>{' '}
        </>
      }
    />
  );
};
