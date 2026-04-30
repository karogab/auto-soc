-- Rejected posts are removed from the database (reactions/reports cascade).
DELETE FROM "Post" WHERE status = 'rejected';
