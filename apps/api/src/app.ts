import Fastify, { type FastifyInstance } from 'fastify';
import type { Pool } from 'pg';
import { createAcademiesHandlers } from '../modules/academies/handlers.ts';
import { createAcademiesRepository } from '../modules/academies/repository.ts';
import { type Contract, loadContract } from './contract.ts';
import { HttpError, type Handlers } from './http.ts';

const CONTRACTS_DIR = new URL('../../../contracts/openapi/', import.meta.url);

export interface AppOptions {
  db: Pool;
  logger?: boolean;
}

/**
 * 계약 파일마다 그 모듈의 핸들러를 붙인다.
 * 계약에 있는 operationId 에 핸들러가 없으면 시작하지 않는다 (규칙 5: 계약이 먼저다).
 */
export function registerContract(app: FastifyInstance, contract: Contract, handlers: Handlers): void {
  for (const schema of contract.schemas) app.addSchema(schema);
  for (const op of contract.operations) {
    const handler = handlers[op.operationId];
    if (!handler) throw new Error(`계약의 ${op.operationId} (${op.method} ${op.path}) 에 핸들러가 없다`);
    app.route({ method: op.method, url: op.url, schema: op.schema, handler });
  }
  const unknown = Object.keys(handlers).filter((id) => !contract.operations.some((op) => op.operationId === id));
  if (unknown.length) throw new Error(`계약에 없는 핸들러: ${unknown.join(', ')}`);
}

export function buildApp({ db, logger = false }: AppOptions): FastifyInstance {
  const app = Fastify({
    // 로그에 요청 본문을 남기지 않는다 (학생 이름 등이 들어갈 수 있다).
    logger: logger ? { level: 'info' } : false,
    ajv: { customOptions: { removeAdditional: false, coerceTypes: false } },
  });

  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof HttpError) {
      return reply.status(error.statusCode).send({ code: error.code, message: error.message });
    }
    const e = error as { validation?: unknown; statusCode?: number; message: string };
    if (e.validation) {
      return reply.status(400).send({ code: 'VALIDATION_ERROR', message: e.message });
    }
    if (e.statusCode && e.statusCode < 500) {
      return reply.status(e.statusCode).send({ code: 'BAD_REQUEST', message: e.message });
    }
    app.log.error(error);
    return reply.status(500).send({ code: 'INTERNAL', message: '서버 오류' });
  });

  app.get('/health', async () => ({ status: 'ok' }));

  registerContract(
    app,
    loadContract(new URL('academies.yaml', CONTRACTS_DIR)),
    createAcademiesHandlers(createAcademiesRepository(db)),
  );

  return app;
}
