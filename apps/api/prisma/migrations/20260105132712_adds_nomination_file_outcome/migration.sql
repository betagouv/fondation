-- CreateEnum
CREATE TYPE nominations_context.nomination_file_outcome_enum AS ENUM (
  'VALIDATED', 'NON_VALIDATED', 'SUSPENDED', 'REMOVED', 'WITHDRAWN'
);

-- AlterTable
ALTER TABLE nominations_context.dossier_de_nomination
ADD COLUMN outcome nominations_context.nomination_file_outcome_enum,
ADD COLUMN outcome_comment TEXT;
