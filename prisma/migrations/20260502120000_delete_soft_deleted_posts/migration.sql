-- Remove posts that were soft-deleted (status deleted); related rows cascade.
DELETE FROM "Post" WHERE status = 'deleted';
