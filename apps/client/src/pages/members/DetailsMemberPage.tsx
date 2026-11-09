import { FormattedMessage } from 'react-intl';
import { useParams } from 'react-router';

import { DetailsMember } from '@/features/members/components/DetailsMember';
import { MemberNotFound } from '@/features/members/components/MemberNotFound';
import { HttpException } from '@/utils/http-exception';
import { useDetailedMember } from '@queries/members.queries';

export function DetailsMemberPage() {
  const { userId } = useParams();
  const { data: member, error, isLoading } = useDetailedMember({ userId });

  if (isLoading) {
    return (
      <div className="fr-container fr-py-8v">
        <p>
          <FormattedMessage defaultMessage="Chargement..." />
        </p>
      </div>
    );
  }

  const isNotFound = error instanceof HttpException && error.statusCode === 404;
  // a failed reload keeps the data loaded before: the page stays rather than the error page
  if (error && !isNotFound && !member) throw error;
  if (!member) return <MemberNotFound />;

  return <DetailsMember member={member} />;
}
