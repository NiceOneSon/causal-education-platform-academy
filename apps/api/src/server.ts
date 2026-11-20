import pg from 'pg';
import { buildApp } from './app.ts';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('DATABASE_URL 이 필요하다 (.env.example 참고)');
  process.exit(1);
}

const db = new pg.Pool({ connectionString: databaseUrl });
const app = buildApp({ db, logger: true });

const shutdown = async () => {
  await app.close();
  await db.end();
  process.exit(0);
};
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

await app.listen({ host: '0.0.0.0', port: Number(process.env.PORT ?? 3000) });
