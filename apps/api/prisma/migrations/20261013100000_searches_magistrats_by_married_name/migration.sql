BEGIN;

-- PostgreSQL 16 cannot change the expression of a generated column: it is dropped, with its index, then added back
ALTER TABLE "nominations_context"."magistrat" DROP COLUMN "search";

ALTER TABLE "nominations_context"."magistrat" ADD COLUMN "search" TSVECTOR GENERATED ALWAYS AS (
    SETWEIGHT(TO_TSVECTOR('unaccent_fr'::regconfig, LOWER(COALESCE("first_name", ''))), 'A') ||
    SETWEIGHT(TO_TSVECTOR('unaccent_fr'::regconfig, LOWER(COALESCE("used_name", ''))), 'A') ||
    SETWEIGHT(TO_TSVECTOR('unaccent_fr'::regconfig, LOWER(COALESCE("last_name", ''))), 'B') ||
    SETWEIGHT(TO_TSVECTOR('unaccent_fr'::regconfig, LOWER(COALESCE("married_name", ''))), 'B') ||
    SETWEIGHT(TO_TSVECTOR('unaccent_fr'::regconfig, LOWER(COALESCE("professional_email", ''))), 'C')
) STORED;

CREATE INDEX "magistrat_search_idx_gin" ON "nominations_context"."magistrat" USING GIN ("search");

COMMIT;
