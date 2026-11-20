// db/migrations/*.sql 을 번호 순서로 적용한다. 적용 기록은 schema_migrations 표에 남긴다.
// ORM을 쓰지 않는다. 각 파일은 한 트랜잭션 안에서 그대로 실행한다.
import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const MIGRATIONS_DIR = fileURLToPath(new URL('../db/migrations/', import.meta.url));

export async function migrate(databaseUrl: string): Promise<string[]> {
  const client = new pg.Client({ connectionString: databaseUrl });
  await client.connect();
  const applied: string[] = [];
  try {
    await client.query(
      `CREATE TABLE IF NOT EXISTS schema_migrations (
         version    text PRIMARY KEY,
         applied_at timestamptz NOT NULL DEFAULT now()
       )`,
    );
    const done = new Set(
      (await client.query<{ version: string }>('SELECT version FROM schema_migrations')).rows.map((r) => r.version),
    );
    const files = (await readdir(MIGRATIONS_DIR)).filter((f) => f.endsWith('.sql')).sort();
    for (const file of files) {
      if (done.has(file)) continue;
      const sql = await readFile(MIGRATIONS_DIR + file, 'utf8');
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (version) VALUES ($1)', [file]);
        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK');
        throw new Error(`migration ${file} failed: ${(err as Error).message}`);
      }
      applied.push(file);
    }
  } finally {
    await client.end();
  }
  return applied;
}

if (import.meta.main) {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL 이 필요하다 (.env.example 참고)');
    process.exit(1);
  }
  const applied = await migrate(url);
  console.log(applied.length ? `applied: ${applied.join(', ')}` : 'up to date');
}
