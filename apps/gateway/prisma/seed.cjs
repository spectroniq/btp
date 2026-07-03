'use strict';
const { Client } = require('pg');
const problems = require('../../web/data/problems.json');
const references = require('../../web/data/references.json');

async function seed() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  // ── DSA Problems ────────────────────────────────────
  let dsaSeeded = 0;
  let dsaSkipped = 0;

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
      if (result.rowCount > 0) dsaSeeded++;
      else dsaSkipped++;
    } catch (err) {
      console.error(`  ✗ dsa/${p.slug}: ${err.message}`);
    }
  }

  console.log(`DSA seed complete: ${dsaSeeded} inserted, ${dsaSkipped} already existed.`);

  // ── References ──────────────────────────────────────
  let refSeeded = 0;
  let refSkipped = 0;

  for (const [category, items] of Object.entries(references)) {
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      try {
        const result = await client.query(
          `INSERT INTO "references"
             (id, category, title, complexity, "when", summary, "order")
           VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6)
           ON CONFLICT DO NOTHING`,
          [category, item.title, item.complexity, item.when, item.summary, i],
        );
        if (result.rowCount > 0) refSeeded++;
        else refSkipped++;
      } catch (err) {
        console.error(`  ✗ ref/${category}/${item.title}: ${err.message}`);
      }
    }
  }

  console.log(`References seed complete: ${refSeeded} inserted, ${refSkipped} already existed.`);

  await client.end();
}

seed().catch(err => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
