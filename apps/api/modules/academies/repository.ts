// academies 모듈의 DB 접근. 순수 SQL만 쓴다 (규칙 6).
import type { Pool } from 'pg';
import type { components } from '@academy/contracts/academies';

type S = components['schemas'];
export type Academy = S['Academy'];
export type Teacher = S['Teacher'];
export type Student = S['Student'];
export type Class = S['Class'];

interface Row {
  id: string;
  name: string;
  created_at: Date;
}
interface MemberRow extends Row {
  academy_id: string;
}

const toAcademy = (r: Row): Academy => ({ id: r.id, name: r.name, createdAt: r.created_at.toISOString() });
const toTeacher = (r: MemberRow): Teacher => ({
  id: r.id,
  academyId: r.academy_id,
  name: r.name,
  createdAt: r.created_at.toISOString(),
});
const toStudent = (r: MemberRow & { grade: number | null }): Student => ({
  id: r.id,
  academyId: r.academy_id,
  name: r.name,
  grade: r.grade,
  createdAt: r.created_at.toISOString(),
});
const toClass = (r: MemberRow & { teacher_id: string | null }): Class => ({
  id: r.id,
  academyId: r.academy_id,
  name: r.name,
  teacherId: r.teacher_id,
  createdAt: r.created_at.toISOString(),
});

export type CreateClassResult = { ok: true; class: Class } | { ok: false; reason: 'teacher_not_found' };
export type EnrollResult = 'enrolled' | 'class_not_found' | 'student_not_found';

export function createAcademiesRepository(db: Pool) {
  const exists = async (sql: string, params: unknown[]) => (await db.query(sql, params)).rowCount === 1;

  return {
    async createAcademy(name: string): Promise<Academy> {
      const { rows } = await db.query<Row>(
        'INSERT INTO academies (name) VALUES ($1) RETURNING id, name, created_at',
        [name],
      );
      return toAcademy(rows[0]!);
    },

    async listAcademies(): Promise<Academy[]> {
      const { rows } = await db.query<Row>('SELECT id, name, created_at FROM academies ORDER BY created_at, id');
      return rows.map(toAcademy);
    },

    async getAcademy(id: string): Promise<Academy | null> {
      const { rows } = await db.query<Row>('SELECT id, name, created_at FROM academies WHERE id = $1', [id]);
      return rows[0] ? toAcademy(rows[0]) : null;
    },

    academyExists(id: string): Promise<boolean> {
      return exists('SELECT 1 FROM academies WHERE id = $1', [id]);
    },

    async createTeacher(academyId: string, name: string): Promise<Teacher> {
      const { rows } = await db.query<MemberRow>(
        'INSERT INTO teachers (academy_id, name) VALUES ($1, $2) RETURNING id, academy_id, name, created_at',
        [academyId, name],
      );
      return toTeacher(rows[0]!);
    },

    async listTeachers(academyId: string): Promise<Teacher[]> {
      const { rows } = await db.query<MemberRow>(
        'SELECT id, academy_id, name, created_at FROM teachers WHERE academy_id = $1 ORDER BY created_at, id',
        [academyId],
      );
      return rows.map(toTeacher);
    },

    async createStudent(academyId: string, name: string, grade: number | null): Promise<Student> {
      const { rows } = await db.query<MemberRow & { grade: number | null }>(
        `INSERT INTO students (academy_id, name, grade) VALUES ($1, $2, $3)
         RETURNING id, academy_id, name, grade, created_at`,
        [academyId, name, grade],
      );
      return toStudent(rows[0]!);
    },

    async listStudents(academyId: string): Promise<Student[]> {
      const { rows } = await db.query<MemberRow & { grade: number | null }>(
        `SELECT id, academy_id, name, grade, created_at FROM students
         WHERE academy_id = $1 ORDER BY created_at, id`,
        [academyId],
      );
      return rows.map(toStudent);
    },

    async createClass(academyId: string, name: string, teacherId: string | null): Promise<CreateClassResult> {
      if (teacherId && !(await exists('SELECT 1 FROM teachers WHERE academy_id = $1 AND id = $2', [academyId, teacherId]))) {
        return { ok: false, reason: 'teacher_not_found' };
      }
      const { rows } = await db.query<MemberRow & { teacher_id: string | null }>(
        `INSERT INTO classes (academy_id, name, teacher_id) VALUES ($1, $2, $3)
         RETURNING id, academy_id, name, teacher_id, created_at`,
        [academyId, name, teacherId],
      );
      return { ok: true, class: toClass(rows[0]!) };
    },

    async listClasses(academyId: string): Promise<Class[]> {
      const { rows } = await db.query<MemberRow & { teacher_id: string | null }>(
        `SELECT id, academy_id, name, teacher_id, created_at FROM classes
         WHERE academy_id = $1 ORDER BY created_at, id`,
        [academyId],
      );
      return rows.map(toClass);
    },

    classExists(academyId: string, classId: string): Promise<boolean> {
      return exists('SELECT 1 FROM classes WHERE academy_id = $1 AND id = $2', [academyId, classId]);
    },

    async enrollStudent(academyId: string, classId: string, studentId: string): Promise<EnrollResult> {
      if (!(await this.classExists(academyId, classId))) return 'class_not_found';
      if (!(await exists('SELECT 1 FROM students WHERE academy_id = $1 AND id = $2', [academyId, studentId]))) {
        return 'student_not_found';
      }
      await db.query(
        `INSERT INTO class_enrollments (academy_id, class_id, student_id) VALUES ($1, $2, $3)
         ON CONFLICT (class_id, student_id) DO NOTHING`,
        [academyId, classId, studentId],
      );
      return 'enrolled';
    },

    async listClassStudents(academyId: string, classId: string): Promise<Student[]> {
      const { rows } = await db.query<MemberRow & { grade: number | null }>(
        `SELECT s.id, s.academy_id, s.name, s.grade, s.created_at
         FROM class_enrollments e JOIN students s ON s.id = e.student_id
         WHERE e.academy_id = $1 AND e.class_id = $2
         ORDER BY s.created_at, s.id`,
        [academyId, classId],
      );
      return rows.map(toStudent);
    },
  };
}

export type AcademiesRepository = ReturnType<typeof createAcademiesRepository>;
