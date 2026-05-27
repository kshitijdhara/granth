UPDATE proposals SET new_title = '' WHERE new_title IS NULL;
ALTER TABLE proposals ALTER COLUMN new_title SET DEFAULT '';
ALTER TABLE proposals ALTER COLUMN new_title SET NOT NULL;
