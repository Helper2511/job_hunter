-- Full-text and fuzzy search over job titles and descriptions.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS "Job_title_trgm_idx" ON "Job" USING GIN ("title" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "Company_name_trgm_idx" ON "Company" USING GIN ("name" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "Job_fts_idx" ON "Job"
  USING GIN (to_tsvector('english', coalesce("title", '') || ' ' || coalesce("description", '')));
