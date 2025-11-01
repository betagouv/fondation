CREATE TABLE IF NOT EXISTS "data_administration_context"."jurisdictions" (
	"codejur" text PRIMARY KEY NOT NULL,
	"type_jur" text NOT NULL,
	"adr1" text,
	"adr2" text,
	"arrondissement" text,
	"codepos" text,
	"date_suppression" date,
	"libelle" text,
	"ressort" text,
	"ville_jur" text,
	"ville" text
);
