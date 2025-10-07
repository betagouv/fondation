import { createModal } from '@codegouvfr/react-dsfr/Modal';
import type { FC } from 'react';

import { MagistratDetails } from './MagistratDetails';
import type { ContenuPropositionDeNominationTransparenceV2 } from 'shared-models/models/session/contenu-transparence-par-version/proposition-content';

export type MagistratDnModaleProps = {
  idDn: string;
  content: ContenuPropositionDeNominationTransparenceV2;
};

export const MagistratDnModale: FC<MagistratDnModaleProps> = ({ content, idDn }) => {
  const modalMagistratDnDetails = createModal({
    id: `modal-magistrat-dn-details-${idDn}`,
    isOpenedByDefault: false
  });

  const onClick = () => {
    modalMagistratDnDetails.open();
  };

  return (
    <>
      <a
        href="#"
        onClick={(e) => {
          e.preventDefault();
          onClick();
        }}
      >
        {content.nomMagistrat}
      </a>
      <modalMagistratDnDetails.Component title={content.nomMagistrat}>
        <MagistratDetails content={content} idDn={idDn} />
      </modalMagistratDnDetails.Component>
    </>
  );
};
