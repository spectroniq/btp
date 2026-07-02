'use strict';
const { Client } = require('pg');
const problems = require('../../web/data/problems.json');

async function seed() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  let seeded = 0;
  let skipped = 0;

  for (const p of problems) {
    try {
      const result = await client.query(
        `INSERT INTO dsa_problems
           (id, slug, title, difficulty, topic, description, examples, constraints, "starterCode", "testCases", "createdAt")
         VALUES (gen_random_uuid(), $1, $2, $3::"Difficulty", $4, $5, $6::text[], $7::text[], $8, $9::jsonb, now())
         ON CONFLICT (slug) DO NOTHING`,
        [
          p.slug,
          p.title,
          p.difficulty,
          p.topic,
          p.description,
          p.examples ?? [],
          p.constraints ?? [],
          p.starterCode ?? '',
          JSON.stringify(p.testCases ?? []),
        ],
      );
      if (result.rowCount > 0) seeded++;
      else skipped++;
    } catch (err) {
      console.error(`  ✗ ${p.slug}: ${err.message}`);
    }
  }

  await client.end();
  console.log(`DSA seed complete: ${seeded} inserted, ${skipped} already existed.`);
}

seed().catch(err => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
