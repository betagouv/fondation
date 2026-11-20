-- CreateEnum
CREATE TYPE "nominations_context"."observation_block_tracking_status_enum" AS ENUM ('IN_PROGRESS', 'DONE');

-- CreateTable
CREATE TABLE "nominations_context"."observation_block_tracking" (
    "session_id" UUID NOT NULL,
    "magistrat_id" UUID NOT NULL,
    "status" "nominations_context"."observation_block_tracking_status_enum" NOT NULL,
    "comment" TEXT,

    CONSTRAINT "observation_block_tracking_pkey" PRIMARY KEY ("session_id","magistrat_id")
);

-- AddForeignKey
ALTER TABLE "nominations_context"."observation_block_tracking" ADD CONSTRAINT "observation_block_tracking_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "nominations_context"."session"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "nominations_context"."observation_block_tracking" ADD CONSTRAINT "observation_block_tracking_magistrat_id_fkey" FOREIGN KEY ("magistrat_id") REFERENCES "data_administration_context"."magistrat"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
