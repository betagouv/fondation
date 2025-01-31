 ALTER TABLE data_administration_context.nomination_files
    ALTER COLUMN content TYPE JSONB USING content - 'state';