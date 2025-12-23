import { createModal } from '@codegouvfr/react-dsfr/Modal';
import { useIsModalOpen } from '@codegouvfr/react-dsfr/Modal/useIsModalOpen';
import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  type PropsWithChildren
} from 'react';
import { Link, useSearchParams, type Path } from 'react-router-dom';
import type { Magistrat } from 'shared-models';

import { type SessionNominationFile } from '../../../../react-query/mutations/sg/nomination-session-affectations';
import { MagistratDetails } from './MagistratDetails';

const modalMagistratDnDetails = createModal({
  id: `modal-magistrat-dn-details`,
  isOpenedByDefault: false
});

type MagistratModalContextType = {
  useLinkProps: (id: string) => { to: Partial<Path> } & (typeof modalMagistratDnDetails)['buttonProps'];
};

const MagistratModalContext = createContext<MagistratModalContextType | null>(null);

export function MagistratModaleProvider(
  props: PropsWithChildren<{ formation: Magistrat.Formation; nominationFiles: SessionNominationFile[] }>
) {
  const [searchParams, setSearchParams] = useSearchParams();

  const currentFileId = searchParams.get('active');
  const isOpen = useIsModalOpen(modalMagistratDnDetails, {
    onConceal() {
      setSearchParams((s) => {
        s.delete('active');
        return s;
      });
    }
  });

  const nominationFile = useMemo(() => {
    if (!currentFileId) return null;

    const nominationFile = props.nominationFiles.find((f) => f.id === currentFileId);
    if (!nominationFile) return null;

    return nominationFile;
  }, [currentFileId, props.nominationFiles]);

  useLayoutEffect(() => {
    if (!isOpen && nominationFile) {
      setSearchParams((s) => {
        s.delete('active');
        return s;
      });
    }
  }, [nominationFile, isOpen, setSearchParams]);

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

  const useLinkProps = useCallback(
    (id: string) => {
      const search = new URLSearchParams(searchParams);
      search.set('active', id);

      return { to: { search: `?${search.toString()}` }, ...modalMagistratDnDetails.buttonProps };
    },
    [searchParams]
  );

  return (
    <>
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
        {nominationFile ? (
          <MagistratDetails nominationFile={nominationFile} formation={props.formation} />
        ) : null}
      </modalMagistratDnDetails.Component>

      <MagistratModalContext value={{ useLinkProps }}>{props.children}</MagistratModalContext>
    </>
  );
}

export function MagistratDnModalLink(props: { nominationFile: SessionNominationFile }) {
  const ctx = useContext(MagistratModalContext);
  if (!ctx) return null;

  const linkProps = ctx.useLinkProps(props.nominationFile.id);
  const hasComment = !!props.nominationFile.comment;

  return (
    <Link {...linkProps}>
      {props.nominationFile.content.nomMagistrat}
      {hasComment && (
        <i
          className="ri-message-3-line ml-1 cursor-pointer"
          style={{ fontSize: '10px' }}
          title="Commentaire présent"
          aria-label="Commentaire présent"
        />
      )}
    </Link>
  );
}
