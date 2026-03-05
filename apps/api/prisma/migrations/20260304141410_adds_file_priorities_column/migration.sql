BEGIN;

ALTER TABLE "nominations_context"."dossier_de_nomination"
  ADD COLUMN "priorities" "nominations_context"."priorite_enum"[] DEFAULT ARRAY[]::"nominations_context"."priorite_enum"[];

UPDATE "nominations_context"."dossier_de_nomination"
  SET "priorities" = ARRAY["priorite"]::"nominations_context"."priorite_enum"[]
WHERE priorite IS NOT NULL;

COMMIT;

