update
	data_administration_context.nomination_files
set 
	"content" = jsonb_set(
        content,
	    '{folderNumber}',
	    'null'::jsonb
    )
where
	content ? 'folderNumber' = false;