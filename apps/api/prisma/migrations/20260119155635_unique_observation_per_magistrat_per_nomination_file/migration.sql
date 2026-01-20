-- CreateIndex
CREATE UNIQUE INDEX "observation_nomination_file_id_magistrat_id_key" ON "nominations_context"."observation"("nomination_file_id", "magistrat_id");
