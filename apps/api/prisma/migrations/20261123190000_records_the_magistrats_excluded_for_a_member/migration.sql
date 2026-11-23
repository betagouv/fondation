-- CreateTable
CREATE TABLE "identity_and_access_context"."excluded_magistrats" (
    "user_id" UUID NOT NULL,
    "magistrat_id" UUID NOT NULL,

    CONSTRAINT "excluded_magistrats_pkey" PRIMARY KEY ("user_id","magistrat_id")
);

-- AddForeignKey
ALTER TABLE "identity_and_access_context"."excluded_magistrats" ADD CONSTRAINT "excluded_magistrats_magistrat_id_fkey" FOREIGN KEY ("magistrat_id") REFERENCES "data_administration_context"."magistrat"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "identity_and_access_context"."excluded_magistrats" ADD CONSTRAINT "excluded_magistrats_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "identity_and_access_context"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
