import { createModal } from '@codegouvfr/react-dsfr/Modal';
import type { FC } from 'react';

import { MagistratDetails } from './MagistratDetails';
import type { SessionNominationFile } from '../../../../react-query/mutations/sg/nomination-session-affectations';

export type MagistratDnModaleProps = {
  idDn: string;
  content: SessionNominationFile['content'];
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
      <modalMagistratDnDetails.Component title={null}>
        <MagistratDetails content={content} idDn={idDn} />
      </modalMagistratDnDetails.Component>
    </>
  );
};
