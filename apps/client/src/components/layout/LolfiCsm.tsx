import { colors } from '@codegouvfr/react-dsfr';

export const LolfiCsm = () => {
  return (
    <div
      className="mr-4 py-2 hover:cursor-pointer"
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.color = colors.decisions.text.title.blueFrance.default;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.color = '';
      }}
    >
      <a href="http://lolfi.dsj.intranet.justice.gouv.fr/csm/" target="_blank">
        LOLFI - CSM
      </a>
    </div>
  );
};
