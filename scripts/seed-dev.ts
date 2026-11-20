// 로컬 개발 DB에 가짜 데이터를 넣는다. 실제 학생·학원 정보를 넣지 않는다.
import pg from 'pg';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL 이 필요하다 (.env.example 참고)');
  process.exit(1);
}
const host = new URL(url).hostname;
if (!['localhost', '127.0.0.1', '::1', 'db'].includes(host)) {
  console.error(`가짜 데이터는 로컬 DB에만 넣는다. host=${host}`);
  process.exit(1);
}

const client = new pg.Client({ connectionString: url });
await client.connect();
try {
  await client.query('BEGIN');
  const academy = await client.query<{ id: string }>(
    `INSERT INTO academies (name) VALUES ('가짜수학학원') RETURNING id`,
  );
  const academyId = academy.rows[0]!.id;
  const teacher = await client.query<{ id: string }>(
    `INSERT INTO teachers (academy_id, name) VALUES ($1, '가짜강사A') RETURNING id`,
    [academyId],
  );
  const cls = await client.query<{ id: string }>(
    `INSERT INTO classes (academy_id, name, teacher_id) VALUES ($1, '중2 심화반', $2) RETURNING id`,
    [academyId, teacher.rows[0]!.id],
  );
  for (const name of ['가짜학생1', '가짜학생2', '가짜학생3']) {
    const student = await client.query<{ id: string }>(
      `INSERT INTO students (academy_id, name, grade) VALUES ($1, $2, 8) RETURNING id`,
      [academyId, name],
    );
    await client.query(
      `INSERT INTO class_enrollments (academy_id, class_id, student_id) VALUES ($1, $2, $3)`,
      [academyId, cls.rows[0]!.id, student.rows[0]!.id],
    );
  }
  await client.query('COMMIT');
  console.log(`seeded academy ${academyId}`);
} catch (err) {
  await client.query('ROLLBACK');
  throw err;
} finally {
  await client.end();
}
