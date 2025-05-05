BEGIN;

CREATE TABLE "data_administration_context"."transparences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" "transparency" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"formations" formation[] NOT NULL,
	"nomination_files_ids" jsonb[] NOT NULL,
	CONSTRAINT "transparences_name_unique" UNIQUE("name")
);

WITH distinct_transparencies AS (
    SELECT 
        DISTINCT (content ->> 'transparency')::transparency as transparency_name,
        array_agg(jsonb_build_object(
            'id', id,
            'createdAt', created_at,
            'rowNumber', row_number,
            'content', content - 'transparency'
        )) as nomination_files_array,
        array_agg(DISTINCT (content ->> 'formation')::formation) as formations
    FROM data_administration_context.nomination_files
    GROUP BY (content ->> 'transparency')
)
INSERT INTO data_administration_context.transparences (id, name, created_at, formations, nomination_files_ids)
SELECT 
    gen_random_uuid(),
    dt.transparency_name,
    NOW(),
    dt.formations,
    dt.nomination_files_array
FROM distinct_transparencies dt;


COMMIT;