// 가짜 데이터만 쓴다 (규칙 1).
import type { FastifyInstance } from 'fastify';
import pg from 'pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { buildApp } from '../../apps/api/src/app.ts';
import { contractErrors } from '../helpers/contract-schemas.ts';
import { testDatabaseUrl } from '../helpers/test-db.ts';

const MISSING_ID = '00000000-0000-4000-8000-000000000000';

let db: pg.Pool;
let app: FastifyInstance;

beforeAll(async () => {
  db = new pg.Pool({ connectionString: testDatabaseUrl() });
  app = buildApp({ db });
  await app.ready();
});

afterAll(async () => {
  await app.close();
  await db.end();
});

beforeEach(async () => {
  await db.query('TRUNCATE class_enrollments, classes, students, teachers, academies');
});

async function call(method: 'GET' | 'POST' | 'PUT', url: string, payload?: unknown, schema?: string) {
  const res = await app.inject({ method, url, payload: payload as object | undefined });
  const body = res.body ? res.json() : undefined;
  if (schema) expect(contractErrors(schema, body)).toBeNull();
  return { status: res.statusCode, body };
}

async function createAcademy(name = '가짜학원') {
  const { body } = await call('POST', '/academies', { name }, 'Academy');
  return body.id as string;
}

describe('academies', () => {
  it('학원을 등록하고 목록·단건으로 조회한다', async () => {
    const created = await call('POST', '/academies', { name: '가짜학원' }, 'Academy');
    expect(created.status).toBe(201);
    expect(created.body.name).toBe('가짜학원');

    const list = await call('GET', '/academies', undefined, 'AcademyList');
    expect(list.body.items.map((a: { id: string }) => a.id)).toEqual([created.body.id]);

    const one = await call('GET', `/academies/${created.body.id}`, undefined, 'Academy');
    expect(one.body).toEqual(created.body);
  });

  it('계약에 맞지 않는 요청은 400', async () => {
    for (const payload of [{}, { name: '' }, { name: '가짜', extra: 1 }, { name: 'x'.repeat(101) }]) {
      const res = await call('POST', '/academies', payload, 'Error');
      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    }
    expect((await call('GET', '/academies/not-a-uuid', undefined, 'Error')).status).toBe(400);
  });

  it('없는 학원은 404', async () => {
    expect((await call('GET', `/academies/${MISSING_ID}`, undefined, 'Error')).status).toBe(404);
    expect((await call('GET', `/academies/${MISSING_ID}/students`, undefined, 'Error')).status).toBe(404);
    expect((await call('POST', `/academies/${MISSING_ID}/teachers`, { name: '가짜강사' }, 'Error')).status).toBe(404);
  });
});

describe('강사·학생·반', () => {
  it('강사와 학생을 등록하고 학원별로 나눠 조회한다', async () => {
    const a = await createAcademy('가짜학원A');
    const b = await createAcademy('가짜학원B');

    const teacher = await call('POST', `/academies/${a}/teachers`, { name: '가짜강사' }, 'Teacher');
    expect(teacher.status).toBe(201);
    const student = await call('POST', `/academies/${a}/students`, { name: '가짜학생', grade: 8 }, 'Student');
    expect(student.status).toBe(201);
    expect(student.body.grade).toBe(8);
    const noGrade = await call('POST', `/academies/${a}/students`, { name: '가짜학생2' }, 'Student');
    expect(noGrade.body.grade).toBeNull();

    expect((await call('GET', `/academies/${a}/teachers`, undefined, 'TeacherList')).body.items).toHaveLength(1);
    expect((await call('GET', `/academies/${a}/students`, undefined, 'StudentList')).body.items).toHaveLength(2);
    expect((await call('GET', `/academies/${b}/students`, undefined, 'StudentList')).body.items).toHaveLength(0);
  });

  it('학년은 1~12만 받는다', async () => {
    const a = await createAcademy();
    expect((await call('POST', `/academies/${a}/students`, { name: '가짜', grade: 13 }, 'Error')).status).toBe(400);
    expect((await call('POST', `/academies/${a}/students`, { name: '가짜', grade: '8' }, 'Error')).status).toBe(400);
  });

  it('반을 만들고 학생을 배정한다 (배정은 여러 번 해도 한 번)', async () => {
    const a = await createAcademy();
    const teacher = (await call('POST', `/academies/${a}/teachers`, { name: '가짜강사' })).body;
    const student = (await call('POST', `/academies/${a}/students`, { name: '가짜학생' })).body;

    const cls = await call('POST', `/academies/${a}/classes`, { name: '중2반', teacherId: teacher.id }, 'Class');
    expect(cls.status).toBe(201);
    expect(cls.body.teacherId).toBe(teacher.id);
    const noTeacher = await call('POST', `/academies/${a}/classes`, { name: '자습반' }, 'Class');
    expect(noTeacher.body.teacherId).toBeNull();

    const url = `/academies/${a}/classes/${cls.body.id}/students`;
    expect((await call('PUT', `${url}/${student.id}`)).status).toBe(204);
    expect((await call('PUT', `${url}/${student.id}`)).status).toBe(204);

    const enrolled = await call('GET', url, undefined, 'StudentList');
    expect(enrolled.body.items.map((s: { id: string }) => s.id)).toEqual([student.id]);
    expect((await call('GET', `/academies/${a}/classes`, undefined, 'ClassList')).body.items).toHaveLength(2);
  });

  it('다른 학원의 강사·학생·반은 쓸 수 없다', async () => {
    const a = await createAcademy('가짜학원A');
    const b = await createAcademy('가짜학원B');
    const teacherB = (await call('POST', `/academies/${b}/teachers`, { name: '가짜강사B' })).body;
    const studentB = (await call('POST', `/academies/${b}/students`, { name: '가짜학생B' })).body;
    const classA = (await call('POST', `/academies/${a}/classes`, { name: '반A' })).body;
    const classB = (await call('POST', `/academies/${b}/classes`, { name: '반B' })).body;

    const wrongTeacher = await call('POST', `/academies/${a}/classes`, { name: '반', teacherId: teacherB.id }, 'Error');
    expect(wrongTeacher.status).toBe(422);
    expect(wrongTeacher.body.code).toBe('INVALID_REFERENCE');

    expect((await call('PUT', `/academies/${a}/classes/${classA.id}/students/${studentB.id}`, undefined, 'Error')).status).toBe(404);
    expect((await call('PUT', `/academies/${a}/classes/${classB.id}/students/${studentB.id}`, undefined, 'Error')).status).toBe(404);
    expect((await call('GET', `/academies/${a}/classes/${classB.id}/students`, undefined, 'Error')).status).toBe(404);
  });

  it('DB도 학원을 넘는 배정을 막는다', async () => {
    const a = await createAcademy('가짜학원A');
    const b = await createAcademy('가짜학원B');
    const classA = (await call('POST', `/academies/${a}/classes`, { name: '반A' })).body;
    const studentB = (await call('POST', `/academies/${b}/students`, { name: '가짜학생B' })).body;
    await expect(
      db.query('INSERT INTO class_enrollments (academy_id, class_id, student_id) VALUES ($1, $2, $3)', [
        a,
        classA.id,
        studentB.id,
      ]),
    ).rejects.toThrow(/foreign key/);
  });
});
