import type { PropsWithChildren } from 'react';

/** @see https://www.systeme-de-design.gouv.fr/version-courante/fr/composants/tableau/design-du-tableau */
export function ReactTableWrapper(props: PropsWithChildren) {
  return (
    <div className="fr-table">
      <div className="fr-table__wrapper">
        <div className="fr-table__container">
          <div className="fr-table__content flex">
            <table className="flex-grow table-fixed" style={{ width: 'initial' }}>
              {props.children}
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
