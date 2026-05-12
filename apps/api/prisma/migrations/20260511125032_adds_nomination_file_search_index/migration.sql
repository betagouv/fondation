BEGIN;

ALTER TABLE "nominations_context"."dossier_de_nomination" ADD COLUMN
  "search" TSVECTOR GENERATED ALWAYS AS (
    TO_TSVECTOR('unaccent_fr', LOWER("name"))
  ) STORED;

CREATE INDEX nomination_file_search_idx_gin ON "nominations_context"."dossier_de_nomination" USING GIN(search);

COMMIT;
