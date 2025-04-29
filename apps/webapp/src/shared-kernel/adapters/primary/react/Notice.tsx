import { Notice as DsfrNotice } from "@codegouvfr/react-dsfr/Notice";
import { FC } from "react";

export type NoticeProps = {
  description: string;
  title: string;
};

export const Notice: FC<NoticeProps> = ({ description, title }) => {
  return <DsfrNotice title={title} description={description} />;
};
