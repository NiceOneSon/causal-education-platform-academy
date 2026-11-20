// contracts/openapi/academies.yaml 의 operationId 마다 핸들러 하나.
// 요청 형식 검사는 계약 스키마로 Fastify가 먼저 한다. 여기서는 존재 여부만 확인하고 DB 결과를 전달한다.
import type { operations } from '@academy/contracts/academies';
import { HttpError, type Handlers, notFound } from '../../src/http.ts';
import type { AcademiesRepository } from './repository.ts';

type Body<Op extends keyof operations> = operations[Op] extends {
  requestBody: { content: { 'application/json': infer B } };
}
  ? B
  : never;
type Params<Op extends keyof operations> = operations[Op]['parameters']['path'];

export function createAcademiesHandlers(repo: AcademiesRepository) {
  const requireAcademy = async (academyId: string) => {
    if (!(await repo.academyExists(academyId))) throw notFound('학원');
  };

  const handlers = {
    async listAcademies() {
      return { items: await repo.listAcademies() };
    },

    async createAcademy(request, reply) {
      const { name } = request.body as Body<'createAcademy'>;
      return reply.status(201).send(await repo.createAcademy(name));
    },

    async getAcademy(request) {
      const { academyId } = request.params as Params<'getAcademy'>;
      const academy = await repo.getAcademy(academyId);
      if (!academy) throw notFound('학원');
      return academy;
    },

    async listTeachers(request) {
      const { academyId } = request.params as Params<'listTeachers'>;
      await requireAcademy(academyId);
      return { items: await repo.listTeachers(academyId) };
    },

    async createTeacher(request, reply) {
      const { academyId } = request.params as Params<'createTeacher'>;
      const { name } = request.body as Body<'createTeacher'>;
      await requireAcademy(academyId);
      return reply.status(201).send(await repo.createTeacher(academyId, name));
    },

    async listStudents(request) {
      const { academyId } = request.params as Params<'listStudents'>;
      await requireAcademy(academyId);
      return { items: await repo.listStudents(academyId) };
    },

    async createStudent(request, reply) {
      const { academyId } = request.params as Params<'createStudent'>;
      const { name, grade } = request.body as Body<'createStudent'>;
      await requireAcademy(academyId);
      return reply.status(201).send(await repo.createStudent(academyId, name, grade ?? null));
    },

    async listClasses(request) {
      const { academyId } = request.params as Params<'listClasses'>;
      await requireAcademy(academyId);
      return { items: await repo.listClasses(academyId) };
    },

    async createClass(request, reply) {
      const { academyId } = request.params as Params<'createClass'>;
      const { name, teacherId } = request.body as Body<'createClass'>;
      await requireAcademy(academyId);
      const result = await repo.createClass(academyId, name, teacherId ?? null);
      if (!result.ok) throw new HttpError(422, 'INVALID_REFERENCE', '이 학원에 그 강사가 없다');
      return reply.status(201).send(result.class);
    },

    async listClassStudents(request) {
      const { academyId, classId } = request.params as Params<'listClassStudents'>;
      await requireAcademy(academyId);
      if (!(await repo.classExists(academyId, classId))) throw notFound('반');
      return { items: await repo.listClassStudents(academyId, classId) };
    },

    async enrollStudent(request, reply) {
      const { academyId, classId, studentId } = request.params as Params<'enrollStudent'>;
      await requireAcademy(academyId);
      const result = await repo.enrollStudent(academyId, classId, studentId);
      if (result === 'class_not_found') throw notFound('반');
      if (result === 'student_not_found') throw notFound('학생');
      return reply.status(204).send();
    },
  } satisfies Record<keyof operations, Handlers[string]>;

  return handlers;
}
