-- members write the jurisdictions a member excludes, LOLFI never does: the table joins the users it belongs to
-- SET SCHEMA keeps the rows, the constraints and the grants, where a generated migration would drop and recreate the table
ALTER TABLE "data_administration_context"."excluded_jurisdictions" SET SCHEMA "identity_and_access_context";
