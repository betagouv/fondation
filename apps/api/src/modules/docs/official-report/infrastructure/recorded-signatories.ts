import { Prisma, PrismaDocVersionStatusEnum } from '../../../../generated/prisma/client';
import { prismaGenderEnumToGenderEnum } from '../../../shared/mappers/gender-enum.mapper';
import { OfficialReportChairman } from '../domain/official-report-chairman';
import { OfficialReportSecretary } from '../domain/official-report-secretary';

export const RECORDED_SIGNATORIES = {
  chairmanDisplayTitle: true,
  chairmanFirstName: true,
  chairmanGender: true,
  chairmanId: true,
  chairmanLastName: true,
  chairmanTitle: true,
  secretaryDisplayTitle: true,
  secretaryFirstName: true,
  secretaryGender: true,
  secretaryId: true,
  secretaryLastName: true,
  secretaryTitle: true,
} as const satisfies Prisma.OfficialReportVersionSelect;

/**
 * the name the document prints its chairman under: their account's for a draft, the one recorded by the
 * validation for a validated report. The copy also stands in for a deleted account.
 */
export function printedChairmanName(version: {
  chairman: { firstName: string; lastName: string } | null;
  chairmanFirstName: string;
  chairmanLastName: string;
  status: PrismaDocVersionStatusEnum;
}): { firstName: string; lastName: string } {
  const recorded = { firstName: version.chairmanFirstName, lastName: version.chairmanLastName };
  return version.status === 'VALIDATED' ? recorded : (version.chairman ?? recorded);
}

/** the chairman and the secretary as the version copied them */
export function recordedSignatories(
  version: Prisma.OfficialReportVersionGetPayload<{ select: typeof RECORDED_SIGNATORIES }>,
): { chairman: OfficialReportChairman; secretary: OfficialReportSecretary } {
  return {
    chairman: OfficialReportChairman.recorded({
      displayTitle: version.chairmanDisplayTitle,
      firstName: version.chairmanFirstName,
      gender: prismaGenderEnumToGenderEnum(version.chairmanGender),
      id: version.chairmanId,
      lastName: version.chairmanLastName,
      title: version.chairmanTitle,
    }),
    secretary: OfficialReportSecretary.recorded({
      displayTitle: version.secretaryDisplayTitle,
      firstName: version.secretaryFirstName,
      gender: prismaGenderEnumToGenderEnum(version.secretaryGender),
      id: version.secretaryId,
      lastName: version.secretaryLastName,
      title: version.secretaryTitle,
    }),
  };
}
