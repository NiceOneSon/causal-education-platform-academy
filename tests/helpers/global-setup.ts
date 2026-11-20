import { migrate } from '../../scripts/migrate.ts';
import { testDatabaseUrl } from './test-db.ts';

export default async function setup() {
  await migrate(testDatabaseUrl());
}
