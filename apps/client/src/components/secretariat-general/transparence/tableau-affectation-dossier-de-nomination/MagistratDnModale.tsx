import { createModal } from '@codegouvfr/react-dsfr/Modal';
import { useIsModalOpen } from '@codegouvfr/react-dsfr/Modal/useIsModalOpen';
import { useCallback, useEffect, useMemo, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
import type { Magistrat } from 'shared-models';

import { type SessionNominationFile } from '../../../../react-query/mutations/sg/nomination-session-affectations';
import { MagistratDetails } from './MagistratDetails';

const modalMagistratDnDetails = createModal({
  id: `modal-magistrat-dn-details`,
  isOpenedByDefault: false
});

export function MagistratDnModale(props: {
  nominationFiles: SessionNominationFile[];
  ref: RefObject<HTMLDivElement | null>;
}) {
  const [searchParams, setSearchParams] = useSearchParams();

  const currentFileId = searchParams.get('active');
  const isOpen = useIsModalOpen(modalMagistratDnDetails);

  const dataIndex = useMemo(
    () => (currentFileId ? props.nominationFiles.findIndex(({ id }) => id === currentFileId) : -1),
    [props.nominationFiles, currentFileId]
  );

  const hasNext = props.nominationFiles.length > 0 && dataIndex < props.nominationFiles.length - 1;
  const hasPrevious = props.nominationFiles.length > 0 && dataIndex > 0;

  const onPreviousClicked = useCallback(() => {
    if (!hasPrevious) return;

    const active = props.nominationFiles[dataIndex - 1].id;
    setSearchParams((s) => {
      s.set('active', active);
      return s;
    });
  }, [hasPrevious, setSearchParams, props.nominationFiles, dataIndex]);

  const onNextClicked = useCallback(() => {
    if (!hasNext) return;

    const active = props.nominationFiles[dataIndex + 1].id;
    setSearchParams((s) => {
      s.set('active', active);
      return s;
    });
  }, [hasNext, setSearchParams, props.nominationFiles, dataIndex]);

  useEffect(() => {
    if (!isOpen && searchParams.has('active')) {
      setSearchParams((s) => {
        s.delete('active');
        return s;
      });
    }
  }, [isOpen, searchParams, setSearchParams]);

  return (
    <modalMagistratDnDetails.Component
      title={null}
      buttons={[
        {
          priority: 'tertiary',
          disabled: !hasPrevious,
          children: 'Précédent',
          iconId: 'fr-icon-arrow-left-s-line',
          iconPosition: 'left',
          onClick: onPreviousClicked,
          doClosesModal: false
        },
        {
          priority: 'tertiary',
          disabled: !hasNext,
          children: 'Suivant',
          iconId: 'fr-icon-arrow-right-s-line',
          iconPosition: 'right',
          onClick: onNextClicked,
          doClosesModal: false
        }
      ]}
    >
      <div ref={props.ref}></div>
    </modalMagistratDnDetails.Component>
  );
}

export function MagistratDnModalLink(props: {
  nominationFile: SessionNominationFile;
  modalRef: React.RefObject<HTMLDivElement | null>;
  formation: Magistrat.Formation;
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const isVisible = searchParams.get('active') === props.nominationFile.id;

  return (
    <>
      <a
        {...modalMagistratDnDetails.buttonProps}
        href="#"
        onClick={(e) => {
          e.preventDefault();
          setSearchParams((s) => {
            s.set('active', props.nominationFile.id);
            return s;
          });
          modalMagistratDnDetails.open();
        }}
      >
        {props.nominationFile.content.nomMagistrat}
      </a>

      {isVisible &&
        createPortal(
          isVisible ? (
            <MagistratDetails
              content={props.nominationFile.content}
              idDn={props.nominationFile.id}
              comment={props.nominationFile.comment}
              commentAccessUserIds={props.nominationFile.commentAccessUserIds}
              formation={props.formation}
            />
          ) : null,
          props.modalRef.current!
        )}
    </>
  );
}
