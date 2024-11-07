update
	data_administration_context.nomination_files
set 
	"content" = jsonb_set(
        content,
	    '{observers}',
	    'null'::jsonb
    )
where
	content ? 'observers' = false;