CREATE TYPE "nominations_context"."magistrat_status_enum" AS ENUM ('ACTIVE', 'INACTIVE');

-- Every magistrat stays active until the first import says otherwise
ALTER TABLE "nominations_context"."magistrat" ADD COLUMN "status" "nominations_context"."magistrat_status_enum" NOT NULL DEFAULT 'ACTIVE';
