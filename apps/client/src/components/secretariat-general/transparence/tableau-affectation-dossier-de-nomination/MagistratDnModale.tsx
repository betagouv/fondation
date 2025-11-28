import { createModal } from '@codegouvfr/react-dsfr/Modal';
import type { FC } from 'react';

import { MagistratDetails } from './MagistratDetails';
import type { SessionNominationFile } from '../../../../react-query/mutations/sg/nomination-session-affectations';

export type MagistratDnModaleProps = {
  idDn: string;
  content: SessionNominationFile['content'];
  comment?: string | null;
};

export const MagistratDnModale: FC<MagistratDnModaleProps> = ({ content, idDn, comment }) => {
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
        <MagistratDetails content={content} idDn={idDn} comment={comment} />
      </modalMagistratDnDetails.Component>
    </>
  );
};
