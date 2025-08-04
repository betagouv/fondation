import { Notice as DsfrNotice } from '@codegouvfr/react-dsfr/Notice';
import type { FC } from 'react';

export type NoticeProps = {
  description: string;
  title: string;
};

export const Notice: FC<NoticeProps> = ({ description, title }) => {
  return <DsfrNotice title={title} description={description} />;
};
