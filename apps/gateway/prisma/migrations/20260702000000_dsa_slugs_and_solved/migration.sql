-- Add missing columns to dsa_problems (were in schema but missing from DB)
ALTER TABLE "dsa_problems" ADD COLUMN IF NOT EXISTS "slug" TEXT NOT NULL DEFAULT '';
ALTER TABLE "dsa_problems" ADD COLUMN IF NOT EXISTS "starterCode" TEXT NOT NULL DEFAULT '';
ALTER TABLE "dsa_problems" ADD COLUMN IF NOT EXISTS "testCases" JSONB NOT NULL DEFAULT '[]';

CREATE UNIQUE INDEX IF NOT EXISTS "dsa_problems_slug_key" ON "dsa_problems"("slug");

-- Add solved tracking to dsa_attempts
ALTER TABLE "dsa_attempts" ADD COLUMN IF NOT EXISTS "solved" BOOLEAN NOT NULL DEFAULT false;

-- Make reasoning optional (default to empty string for code submissions)
ALTER TABLE "dsa_attempts" ALTER COLUMN "reasoning" SET DEFAULT '';
