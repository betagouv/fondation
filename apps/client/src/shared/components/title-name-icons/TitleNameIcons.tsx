import { DetailsLink } from '@/shared/components/details-link';
import { LolfiLink } from '@/shared/components/lolfi-link';

export function TitleNameIcons(props: {
  name: string | null;
  small?: boolean;
  detailsLink?: {
    context: 'sg' | 'membre';
    magistratId: string | null | undefined;
  };
  lolfi: { href: string } | { sessionId: string; nominationFileId: string };
}) {
  const words = (props.name ?? '').split(' ');
  const tail = words.pop();
  const start = words.join(' ');

  return (
    <>
      {start && `${start} `}
      <span className="inline-flex items-center whitespace-nowrap [&_span[id^=tooltip-owner]]:inline-flex">
        {tail}
        <span className="ml-2 inline-flex items-center">
          {props.detailsLink && (
            <DetailsLink
              context={props.detailsLink.context}
              magistratId={props.detailsLink.magistratId}
              small={props.small}
            />
          )}
          {'href' in props.lolfi ? (
            <LolfiLink href={props.lolfi.href} small={props.small} />
          ) : (
            <LolfiLink
              name={props.name}
              nominationFileId={props.lolfi.nominationFileId}
              sessionId={props.lolfi.sessionId}
              small={props.small}
            />
          )}
        </span>
      </span>
    </>
  );
}
